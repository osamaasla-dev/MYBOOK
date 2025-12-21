import type { ModerationContext } from "@/features/types";

export const MODERATION_CHANNEL_NAME = "asla";

export const MODERATION_THRESHOLDS: Record<ModerationContext, number> = {
  post: 0.1,
  comment: 0.3,
  message: 5,
};
