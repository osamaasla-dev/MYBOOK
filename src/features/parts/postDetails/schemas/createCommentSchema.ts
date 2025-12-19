import { z } from "zod";

import { commentMessages } from "@/lib/messages";

export const createCommentSchema = z.object({
  content: z
    .string()
    .trim()
    .min(1, commentMessages.validation.contentRequired)
    .max(2000, commentMessages.validation.contentTooLong),
  parentId: z
    .string()
    .cuid()
    .optional()
    .nullable()
    .transform((value) => value ?? null)
    .default(null),
});

export type CreateCommentInput = z.infer<typeof createCommentSchema>;
