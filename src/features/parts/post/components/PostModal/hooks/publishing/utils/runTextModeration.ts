import type { ModerationContext, ModerationDecision } from "@/features/types";

import { decideModerationAction } from "@/features/parts/moderation/constants/moderationThresholds";
import type { ModerationCheckResult } from "@/features/parts/moderation/types/moderationTypes";

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
