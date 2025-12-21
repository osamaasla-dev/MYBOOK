import { z } from "zod";

export const deleteCommentSchema = z.object({
  commentId: z.string().cuid(),
});

export type DeleteCommentInput = z.infer<typeof deleteCommentSchema>;
