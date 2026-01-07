import { decideModerationAction } from "@/features/parts/moderation/utils";
import {
  checkImageModeration,
  checkVideoModeration,
} from "@/features/parts/moderation/services/server";
import type {
  ModerationContext,
  ModerationDecision,
} from "../../moderation/types/moderationTypes";

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
