import type {
  ModerationContext,
  ModerationDecision,
  ModerationDecisionStatus,
} from "@/features/types";
import { MODERATION_THRESHOLDS } from "../constants";

import type { ModerationCheckResult } from "@/features/parts/moderation/types/moderationTypes";

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

type RunTextModerationParams = {
  content: string;
  context?: ModerationContext;
  mutateAsync: (input: {
    content: string;
    context: ModerationContext;
  }) => Promise<ModerationCheckResult>;
};

export async function runTextModeration({
  content,
  context = "post",
  mutateAsync,
}: RunTextModerationParams): Promise<ModerationDecision> {
  const moderationResult = await mutateAsync({ content, context });
  return decideModerationAction(
    moderationResult.context,
    moderationResult.severity
  );
}
