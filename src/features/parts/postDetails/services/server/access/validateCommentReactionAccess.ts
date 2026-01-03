import { prisma } from "@/lib/prisma";
import { validatePostAccess } from "./validatePostAccess";

export type ValidateCommentReactionAccessInput = {
  commentId: string;
  userId: string;
};

export async function validateCommentReactionAccess({
  commentId,
  userId,
}: ValidateCommentReactionAccessInput) {
  // First get the comment to extract postId for access validation
  const comment = await prisma.comment.findUnique({
    where: { id: commentId },
    select: { postId: true },
  });

  if (!comment) {
    return {
      allowed: false,
      reason: "Comment not found",
      postId: null,
    };
  }

  // Validate post access before processing reaction
  const accessResult = await validatePostAccess({
    postId: comment.postId,
    viewerId: userId,
  });

  if (!accessResult) {
    return {
      allowed: false,
      reason: "Access denied: Cannot react to comment on this post",
      postId: comment.postId,
    };
  }

  return {
    allowed: true,
    reason: null,
    postId: comment.postId,
  };
}
