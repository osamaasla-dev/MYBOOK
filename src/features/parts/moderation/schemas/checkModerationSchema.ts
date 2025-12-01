import { z } from "zod";

import { MODERATION_CONTEXTS } from "@/features/types";
import { moderationMessages } from "@/lib/messages";

export const checkModerationSchema = z.object({
  content: z
    .string()
    .trim()
    .min(1, moderationMessages.validation.contentRequired)
    .max(5000, moderationMessages.validation.contentTooLong),
  context: z.enum(MODERATION_CONTEXTS).default("post"),
});

export type CheckModerationInput = z.infer<typeof checkModerationSchema>;
