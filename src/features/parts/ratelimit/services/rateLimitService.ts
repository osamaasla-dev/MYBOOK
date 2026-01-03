import { userMessages } from "@/lib/messages";
import { consumeRateLimit } from "../utils";
import { apiResponse } from "@/lib/apiResponse";
import type { Logger } from "pino";
import { extractClientIp } from "../utils/request";

type RateLimitResult = { ok: false; response: Response } | { ok: true };

export async function checkRateLimit({
  namespace,
  viewerId,
  windowSeconds,
  maxRequests,
  log,
  request,
  requestId,
}: {
  namespace: string;
  viewerId: string;
  windowSeconds: number;
  maxRequests: number;
  log: Logger;
  request: Request;
  requestId: string;
}): Promise<RateLimitResult> {
  const clientIp = extractClientIp(request);

  const limited = await consumeRateLimit({
    namespace,
    identifiers: [
      { key: "user", value: viewerId },
      { key: "ip", value: clientIp },
    ],
    windowSeconds,
    maxRequests,
  });

  if (limited) {
    log.warn({ viewerId, clientIp }, "Friend request rate-limited");
    return {
      ok: false,
      response: apiResponse(
        false,
        {},
        userMessages.rateLimited,
        429,
        requestId
      ),
    };
  }

  return { ok: true };
}
