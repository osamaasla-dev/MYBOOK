import { prisma } from "@/lib/prisma";
import type { FeedPostRecord } from "@/features/parts/post/utils";
import { postDetailsLogger } from "../../utils/logger";

type FetchPostDetailsInput = {
  postId: string;
};

export async function fetchPostDetails({
  postId,
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
      },
    },
  });

  if (!post) {
    log.warn("Post details not found");
    return null;
  }

  log.debug("Fetched post details");
  return post;
}
