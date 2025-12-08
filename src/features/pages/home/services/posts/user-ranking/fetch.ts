import { prisma } from "@/lib/prisma";

import {
  determineCandidateCount,
  determineFinalSelectionCount,
  readImportantUsersCache,
  writeImportantUsersCache,
  scoreInteractionCandidate,
} from "@/features/pages/home/utils/posts/user-ranking";
import type {
  ImportantUserScore,
  RawInteractionCandidate,
} from "@/features/pages/home/utils/posts/user-ranking";

async function getBlockedUserIds(viewerId: string) {
  const blocks = await prisma.block.findMany({
    where: {
      OR: [{ blockerId: viewerId }, { blockedId: viewerId }],
    },
    select: {
      blockerId: true,
      blockedId: true,
    },
  });

  const blockedSet = new Set<string>();
  for (const block of blocks) {
    if (block.blockerId === viewerId) {
      blockedSet.add(block.blockedId);
    }
    if (block.blockedId === viewerId) {
      blockedSet.add(block.blockerId);
    }
  }

  return blockedSet;
}

export async function getImportantUsersForFeed(viewerId: string) {
  if (!viewerId) return [] as ImportantUserScore[];

  const cached = await readImportantUsersCache(viewerId);
  if (cached && cached.scores.length) {
    return cached.scores;
  }

  const viewer = await prisma.user.findUnique({
    where: { id: viewerId },
    select: { totalInteractedUsers: true },
  });

  const totalRelations = viewer?.totalInteractedUsers ?? 0;
  const candidateCount = determineCandidateCount(totalRelations);

  const blockedUsers = await getBlockedUserIds(viewerId);
  const blockedIds = Array.from(blockedUsers);

  const sourceUsers = await prisma.userInteractionStats.findMany({
    where: {
      userId: viewerId,
      ...(blockedIds.length
        ? {
            targetUserId: { notIn: blockedIds },
          }
        : {}),
    },
    select: {
      targetUserId: true,
      interactionWeight: true,
      lastInteractionAt: true,
    },
    orderBy: {
      interactionWeight: "desc",
    },
    take: candidateCount,
  });

  if (!sourceUsers.length) {
    return [];
  }

  const candidates: RawInteractionCandidate[] = sourceUsers.map((stat) => ({
    targetUserId: stat.targetUserId,
    interactionWeight: stat.interactionWeight,
    lastInteractionAt: stat.lastInteractionAt,
  }));

  const scored = candidates.map((candidate) =>
    scoreInteractionCandidate(candidate)
  );
  const finalCount = determineFinalSelectionCount(candidateCount);
  const importantUsers = scored
    .sort((a, b) => b.score - a.score)
    .slice(0, finalCount);

  await writeImportantUsersCache(viewerId, importantUsers);

  return importantUsers;
}
