import { prisma } from "@/lib/prisma";
import { buildViewerRelationshipMap } from "@/features/pages/home/services/posts/post-ranking/relationships";
import { FeedPost } from "@/features/pages/home/utils/posts/feed-response";
import { buildFeedPost } from "@/features/parts/post/utils";
import { PostReactionType } from "@/features/parts/post/constants/reactions";
import { createFeedRelationshipSnapshot } from "@/features/pages/home/utils/posts/feed-response";
import { Logger } from "pino";
import { profileMessages } from "@/lib/messages";
import { fetchProfilePosts } from "./fetchProfilePosts";

export interface GetProfilePostsOptions {
  username: string;
  viewerId: string;
  cursor?: string;
  limit: number;
  log: Logger;
  requestId: string;
}

export interface GetProfilePostsResult {
  posts: FeedPost[];
  nextCursor: string | null;
}

export async function getProfilePosts({
  username,
  viewerId,
  cursor,
  limit,
  log,
  requestId,
}: GetProfilePostsOptions): Promise<GetProfilePostsResult> {
  // Get profile owner by username
  const profileOwner = await prisma.user.findUnique({
    where: { username },
    select: { id: true, isPrivate: true },
  });

  if (!profileOwner) {
    log.warn({ username, requestId }, profileMessages.notFound);
    throw new Error(profileMessages.notFound);
  }

  // Build relationship map
  const relationshipMap = await buildViewerRelationshipMap(viewerId, [
    profileOwner.id,
  ]);
  const relationship =
    relationshipMap.get(profileOwner.id) ??
    createFeedRelationshipSnapshot(viewerId, profileOwner.id);

  // Get posts with full data
  const posts = await fetchProfilePosts({
    relationship,
    profileOwnerId: profileOwner.id,
    viewerId,
    cursor,
    limit,
  });

  // Handle pagination
  let nextCursor: string | null = null;
  if (posts.length > limit) {
    const nextItem = posts.pop();
    nextCursor = nextItem?.id ?? null;
  }

  // Transform posts to feed format
  const feedPosts: FeedPost[] = posts.map((post) =>
    buildFeedPost({
      post,
      relationship,
      viewerReaction:
        (post.reactions[0]?.emoji as PostReactionType | undefined) ?? null,
    })
  );

  return {
    posts: feedPosts,
    nextCursor,
  };
}
