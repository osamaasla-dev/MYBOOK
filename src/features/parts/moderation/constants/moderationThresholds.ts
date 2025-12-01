import type {
  ModerationContext,
  ModerationDecision,
  ModerationDecisionStatus,
} from "@/features/types";

export const MODERATION_THRESHOLDS: Record<ModerationContext, number> = {
  post: 0.5,
  comment: 0.7,
  message: 5,
};

export function decideModerationAction(
  context: ModerationContext,
  severity: number
): ModerationDecision {
  const threshold = MODERATION_THRESHOLDS[context];
  const status: ModerationDecisionStatus =
    severity <= threshold ? "allow" : "reject";

  return {
    context,
    severity,
    threshold,
    status,
  };
}
