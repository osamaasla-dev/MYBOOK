import { clearRankedPostsCache } from "@/features/pages/home/utils/posts/post-ranking/cache";
import { broadcastPostCreatedEvent } from "@/features/parts/post/utils/realtime";
import { getPostNotificationRecipients } from "@/features/parts/post/utils/recipients";
import { getActor } from "@/features/parts/post/utils/actor";
import { createPostNotifications } from "@/features/parts/post/services/server/postNotifications";
import { createPost } from "./createPost";
import type { Logger } from "pino";
import type { User } from "next-auth";
import type { CreatePostInput } from "../../schemas";
import type { CreatePostResponseData } from "../../types";

export async function processPostCreation({
  viewer,
  postData,
  requestId,
  ROUTE,
  log,
}: {
  viewer: User;
  postData: CreatePostInput;
  requestId: string;
  ROUTE: string;
  log: Logger;
}): Promise<CreatePostResponseData> {
  // Create the post
  const post = await createPost({
    authorId: viewer.id,
    input: postData,
  });

  // Clear ranked posts cache for the author
  if (post) {
    await clearRankedPostsCache(viewer.id);
  }

  log.info({ postId: post.id, userId: viewer.id }, "Post created successfully");

  // Handle notifications and broadcasting
  try {
    const recipients = await getPostNotificationRecipients({
      authorId: viewer.id,
      visibility: post.visibility,
      visibilityPreference: post.visibilityPreference,
      requestId,
      ROUTE,
    });

    if (recipients.length) {
      const authorRecord = await getActor(viewer.id);
      const authorName = authorRecord?.name ?? viewer.name ?? "Someone";
      const authorUsername = authorRecord?.username ?? null;

      await Promise.all([
        createPostNotifications({
          actorId: viewer.id,
          postId: post.id,
          authorName,
          authorUsername,
          recipientIds: recipients,
          requestId,
          ROUTE,
        }),
        broadcastPostCreatedEvent({
          postId: post.id,
          authorId: viewer.id,
          authorName,
          recipientIds: recipients,
        }),
      ]);

      log.info(
        { postId: post.id, recipients: recipients.length },
        "Post created event broadcasted"
      );
    } else {
      log.warn({ postId: post.id }, "No post notification recipients found");
    }
  } catch (broadcastError) {
    log.error(
      { error: broadcastError, postId: post.id },
      "Failed to broadcast post created event"
    );
  }

  return post;
}
