import { prisma } from "@/lib/prisma";
import { commentMessages } from "@/lib/messages";
import type { ReactionSummary } from "@/features/parts/post/utils/reaction";
import { CommentRouteError } from "../../../utils/server/comments/errors";

export type CommentContext = {
  post: {
    id: string;
    authorId: string;
    commentsCount: number;
    sharesCount: number;
    reactionSummary: ReactionSummary | null;
  };
  parentComment: {
    id: string;
    postId: string;
    authorId: string;
  } | null;
};

export type ResolveCommentContextInput = {
  postId: string;
  parentId?: string | null;
  viewerId: string;
};

type CommentContextErrorCode =
  | "POST_NOT_FOUND"
  | "PARENT_NOT_FOUND"
  | "INVALID_PARENT"
  | "BLOCKED";

type CommentContextErrorMeta = {
  status: number;
  message: string;
};

const ERROR_META: Record<CommentContextErrorCode, CommentContextErrorMeta> = {
  POST_NOT_FOUND: { status: 404, message: commentMessages.postNotFound },
  PARENT_NOT_FOUND: { status: 404, message: commentMessages.parentNotFound },
  INVALID_PARENT: { status: 400, message: commentMessages.invalidParent },
  BLOCKED: { status: 403, message: commentMessages.blocked },
};

export class CommentContextError extends CommentRouteError {
  code: CommentContextErrorCode;

  constructor(code: CommentContextErrorCode) {
    const meta = ERROR_META[code];
    super(meta.message, meta.status);
    this.code = code;
  }
}

export async function resolveCommentContext({
  postId,
  parentId = null,
  viewerId,
}: ResolveCommentContextInput): Promise<CommentContext> {
  const [post, parentComment] = await Promise.all([
    prisma.post.findFirst({
      where: { id: postId, isDeleted: false },
      select: {
        id: true,
        authorId: true,
        commentsCount: true,
        sharesCount: true,
        reactionSummary: true,
      },
    }),
    parentId
      ? prisma.comment.findFirst({
          where: { id: parentId },
          select: {
            id: true,
            postId: true,
            authorId: true,
            isDeleted: true,
          },
        })
      : null,
  ]);

  if (!post) {
    throw new CommentContextError("POST_NOT_FOUND");
  }

  if (parentId) {
    if (!parentComment || parentComment.isDeleted) {
      throw new CommentContextError("PARENT_NOT_FOUND");
    }

    if (parentComment.postId !== postId) {
      throw new CommentContextError("INVALID_PARENT");
    }
  }

  const blockExists = await prisma.block.findFirst({
    where: {
      OR: [
        { blockerId: viewerId, blockedId: post.authorId },
        { blockerId: post.authorId, blockedId: viewerId },
      ],
    },
    select: { id: true },
  });

  if (blockExists) {
    throw new CommentContextError("BLOCKED");
  }

  return {
    post: {
      id: post.id,
      authorId: post.authorId,
      commentsCount: post.commentsCount,
      sharesCount: post.sharesCount,
      reactionSummary: (post.reactionSummary as ReactionSummary | null) ?? null,
    },
    parentComment: parentComment
      ? {
          id: parentComment.id,
          postId: parentComment.postId,
          authorId: parentComment.authorId,
        }
      : null,
  };
}
