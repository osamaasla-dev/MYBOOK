"use server";

import {
  Visibility,
  PostVisibilityPreference,
  type Prisma,
} from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

const TOP_PERCENTAGE = 0.1;
const MAX_RECIPIENTS = 100;

type GetPostNotificationRecipientsInput = {
  authorId: string;
  visibility: Visibility;
  visibilityPreference: PostVisibilityPreference;
  requestId: string;
  ROUTE: string;
};

function determineRecipientLimit(totalInteractedUsers: number): number {
  if (!Number.isFinite(totalInteractedUsers) || totalInteractedUsers <= 0) {
    return 0;
  }

  const calculated = Math.ceil(totalInteractedUsers * TOP_PERCENTAGE);
  return Math.min(MAX_RECIPIENTS, Math.max(calculated, 1));
}

async function resolveEffectiveVisibility(
  authorId: string,
  visibility: Visibility,
  visibilityPreference: PostVisibilityPreference
): Promise<Visibility> {
  if (visibilityPreference !== PostVisibilityPreference.ACCOUNT_DEFAULT) {
    return visibility;
  }

  const privacySetting = await prisma.privacySetting.findUnique({
    where: { userId: authorId },
    select: { postsVisibility: true },
  });

  return privacySetting?.postsVisibility ?? visibility;
}

export async function getPostNotificationRecipients({
  authorId,
  visibility,
  visibilityPreference,
  requestId,
  ROUTE,
}: GetPostNotificationRecipientsInput): Promise<string[]> {
  const log = logger.child({
    requestId: requestId,
    route: ROUTE,
  });
  if (!authorId) {
    log.warn("getPostNotificationRecipients called without authorId");
    return [];
  }

  const viewer = await prisma.user.findUnique({
    where: { id: authorId },
    select: { totalInteractedUsers: true },
  });

  const limit = determineRecipientLimit(viewer?.totalInteractedUsers ?? 0);
  if (!limit) {
    log.debug(
      { authorId },
      "Skipping post notification recipients due to insufficient interactions"
    );
    return [];
  }

  const effectiveVisibility = await resolveEffectiveVisibility(
    authorId,
    visibility,
    visibilityPreference
  );
  if (
    effectiveVisibility !== Visibility.FRIENDS &&
    effectiveVisibility !== Visibility.FRIENDS_FOLLOWERS
  ) {
    log.debug(
      { authorId, effectiveVisibility },
      "Skipping post notification recipients due to non-friend visibility"
    );
    return [];
  }

  const where: Prisma.UserInteractionStatsWhereInput = {
    userId: authorId,
    interactionWeight: { gt: 0 },
    targetUser: {
      blockedBy: {
        none: {
          blockerId: authorId,
        },
      },
      blocks: {
        none: {
          blockedId: authorId,
        },
      },
    },
  };

  where.isFriend = true;

  const stats = await prisma.userInteractionStats.findMany({
    where,
    orderBy: { interactionWeight: "desc" },
    take: limit,
    select: { targetUserId: true },
  });

  const recipients = stats.map((stat) => stat.targetUserId);
  log.debug(
    { authorId, recipientsCount: recipients.length },
    "Resolved post notification recipients"
  );
  return recipients;
}
