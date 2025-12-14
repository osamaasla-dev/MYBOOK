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
import { getBlockedUserIds } from "@/features/services/server/blockedUsers";

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

  let importantUsers: ImportantUserScore[] = [];

  if (sourceUsers.length) {
    const candidates: RawInteractionCandidate[] = sourceUsers.map((stat) => ({
      targetUserId: stat.targetUserId,
      interactionWeight: stat.interactionWeight,
      lastInteractionAt: stat.lastInteractionAt,
    }));

    const scored = candidates.map((candidate) =>
      scoreInteractionCandidate(candidate)
    );
    const finalCount = determineFinalSelectionCount(candidateCount);
    importantUsers = scored
      .sort((a, b) => b.score - a.score)
      .slice(0, finalCount);
  }

  const topScore = importantUsers.length ? importantUsers[0].score : 0;
  const topScoreIsValid = Number.isFinite(topScore) && topScore > 0;
  const viewerScoreBoost = topScoreIsValid ? topScore * 1.15 : 20;

  const viewerEntry: ImportantUserScore = {
    targetUserId: viewerId,
    score: viewerScoreBoost,
    interactionWeight: viewerScoreBoost,
    decayFactor: 1,
    lastInteractionAt: new Date(),
  };

  const withoutViewer = importantUsers.filter(
    (user) => user.targetUserId !== viewerId
  );
  const finalImportantUsers = [viewerEntry, ...withoutViewer].sort(
    (a, b) => b.score - a.score
  );

  await writeImportantUsersCache(viewerId, finalImportantUsers);

  return finalImportantUsers;
}
