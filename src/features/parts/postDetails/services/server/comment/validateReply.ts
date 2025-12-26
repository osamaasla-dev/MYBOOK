import { commentMessages } from "@/lib/messages";
import { prisma } from "@/lib/prisma";
import { Logger } from "pino";
import { apiResponse } from "@/lib/apiResponse";

export async function validateReplyCreation(
  payload: { content: string; parentId: string | null },
  log: Logger,
  requestId: string
) {
  // Protection: Prevent creating replies to replies (only allow replies to main comments)
  if (payload.parentId) {
    const parentComment = await prisma.comment.findUnique({
      where: { id: payload.parentId },
      select: { parentId: true },
    });

    if (parentComment?.parentId) {
      log.warn(
        {
          requestId,
          parentId: payload.parentId,
          parentParentId: parentComment.parentId,
        },
        commentMessages.validation.replyToReply
      );
      return {
        error: apiResponse(
          false,
          null,
          commentMessages.validation.replyToReply,
          400,
          requestId
        ),
      };
    }
  }

  return null; // null means validation passed
}
