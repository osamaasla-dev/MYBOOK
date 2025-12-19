import type { Logger } from "pino";

import {
  POST_VIEW_RATE_LIMIT_MAX,
  POST_VIEW_RATE_LIMIT_NAMESPACE,
  POST_VIEW_RATE_LIMIT_WINDOW_SECONDS,
} from "./constants";
import { consumeRateLimit } from "@/features/utils/rateLimit";

export async function consumePostViewRateLimit(
  viewerKey: string | null,
  {
    limit = POST_VIEW_RATE_LIMIT_MAX,
    windowSeconds = POST_VIEW_RATE_LIMIT_WINDOW_SECONDS,
    log,
  }: { limit?: number; windowSeconds?: number; log?: Logger } = {}
): Promise<boolean> {
  if (!viewerKey) return false;

  try {
    return await consumeRateLimit({
      namespace: POST_VIEW_RATE_LIMIT_NAMESPACE,
      identifiers: [{ key: "viewer", value: viewerKey }],
      windowSeconds,
      maxRequests: limit,
    });
  } catch (error) {
    log?.error({ viewerKey, error }, "consumePostViewRateLimit failed");
    return false;
  }
}
