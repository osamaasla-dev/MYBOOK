import { decideModerationAction } from "@/features/parts/moderation/constants/moderationThresholds";
import {
  checkImageModeration,
  checkVideoModeration,
} from "@/features/parts/moderation/services";
import type { ModerationContext, ModerationDecision } from "@/features/types";

import type { MediaMetadata } from "../types/media";

export async function evaluateModeration(
  metadata: MediaMetadata,
  moderationContext: ModerationContext
): Promise<ModerationDecision> {
  const moderationOutcome =
    metadata.type === "video"
      ? await checkVideoModeration(metadata.url, moderationContext)
      : await checkImageModeration(metadata.url, moderationContext);

  return decideModerationAction(
    moderationOutcome.context,
    moderationOutcome.severity
  );
}
