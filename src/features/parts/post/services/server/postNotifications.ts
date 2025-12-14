import { NotificationType } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

export type CreatePostNotificationsInput = {
  actorId: string;
  postId: string;
  authorName: string | null;
  authorUsername: string | null;
  recipientIds: string[];
  requestId: string;
  ROUTE: string;
};

export async function createPostNotifications({
  actorId,
  postId,
  authorName,
  authorUsername,
  recipientIds,
  requestId,
  ROUTE,
}: CreatePostNotificationsInput) {
  const log = logger.child({
    requestId: requestId,
    route: ROUTE,
  });
  if (!actorId || !postId || recipientIds.length === 0) {
    log.warn(
      { actorId, postId, recipientCount: recipientIds.length },
      "createPostNotifications called with missing data"
    );
    return { count: 0 };
  }

  const metadata = {
    kind: "post_created" as const,
    authorName,
    authorUsername,
    status: "accepted",
  };

  const data = recipientIds
    .filter((userId) => userId && userId !== actorId)
    .map((userId) => ({
      userId,
      actorId,
      type: NotificationType.POST,
      postId,
      metadata,
    }));

  if (!data.length) {
    log.debug(
      { actorId, postId },
      "No eligible recipients after filtering for post notifications"
    );
    return { count: 0 };
  }

  const result = await prisma.notification.createMany({
    data,
  });

  log.info(
    { actorId, postId, inserted: result.count },
    "Created post notifications"
  );
  return result;
}
