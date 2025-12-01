import { apiPostR } from "@/lib/api";

import type { CheckModerationInput } from "../schemas";
import type { ModerationCheckResult } from "../../../types";

const MODERATION_CHECK_ENDPOINT = "/moderation/check";

export async function submitModerationRequest(
  payload: CheckModerationInput
): Promise<ModerationCheckResult> {
  const { data } = await apiPostR<ModerationCheckResult>(
    MODERATION_CHECK_ENDPOINT,
    payload
  );
  return data;
}
