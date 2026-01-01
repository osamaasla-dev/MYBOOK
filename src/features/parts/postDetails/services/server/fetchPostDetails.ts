import { prisma } from "@/lib/prisma";
import type { FeedPostRecord } from "@/features/parts/post/utils";
import { isBlock } from "@/features/parts/block/utils/server";
import { postDetailsLogger } from "../../utils/logger";

type FetchPostDetailsInput = {
  postId: string;
  viewerId: string | null;
};

export async function fetchPostDetails({
  postId,
  viewerId,
}: FetchPostDetailsInput): Promise<FeedPostRecord | null> {
  const log = postDetailsLogger.child({
    func: "fetchPostDetails",
    postId,
  });

  const post = await prisma.post.findFirst({
    where: {
      id: postId,
      isDeleted: false,
    },
    select: {
      id: true,
      authorId: true,
      content: true,
      richContent: true,
      linkPreview: true,
      publishedAt: true,
      visibility: true,
      visibilityPreference: true,
      reactionsCount: true,
      commentsCount: true,
      sharesCount: true,
      viewCount: true,
      reactionSummary: true,
      author: {
        select: {
          id: true,
          name: true,
          username: true,
          avatarUrl: true,
          isVerified: true,
          isPrivate: true,
          privacySetting: {
            select: {
              postsVisibility: true,
            },
          },
        },
      },
      media: {
        select: {
          id: true,
          url: true,
          type: true,
          width: true,
          height: true,
          duration: true,
        },
        where: {
          isDeleted: false,
        },
      },
    },
  });

  if (!post) {
    log.warn("Post details not found");
    return null;
  }

  if (viewerId && post.authorId) {
    const blockStatus = await isBlock(viewerId, post.authorId);
    if (blockStatus.anyBlock) {
      log.warn(
        { viewerId, authorId: post.authorId },
        "Viewer blocked from fetching post details"
      );
      return null;
    }
  }

  log.debug("Fetched post details");
  return post;
}
