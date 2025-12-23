import { z } from "zod";

import { commentMessages } from "@/lib/messages";

export const updateCommentSchema = z.object({
  commentId: z.string().cuid(commentMessages.commentNotFound ?? "Invalid ID"),
  content: z
    .string()
    .trim()
    .min(1, commentMessages.validation.contentRequired)
    .max(2000, commentMessages.validation.contentTooLong),
});

export type UpdateCommentInput = z.infer<typeof updateCommentSchema>;
