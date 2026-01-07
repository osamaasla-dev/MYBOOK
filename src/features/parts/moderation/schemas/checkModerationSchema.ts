import { z } from "zod";

import { moderationMessages } from "@/lib/messages";
import { MODERATION_CONTEXTS } from "../types/moderationTypes";

export const checkModerationSchema = z.object({
  content: z
    .string()
    .trim()
    .min(1, moderationMessages.validation.contentRequired)
    .max(5000, moderationMessages.validation.contentTooLong),
  context: z.enum(MODERATION_CONTEXTS).default("post"),
});

export type CheckModerationInput = z.infer<typeof checkModerationSchema>;
