// lib/request-log.ts
// Helper for Node runtime route handlers to obtain requestId and a child logger.
// NOTE: Do not use this in Edge runtime. For Edge, use `headers()` and `console` directly.

import { logger } from "@/lib/logger";
import { createId } from "@paralleldrive/cuid2";
import { headers } from "next/headers";
import type { Logger } from "pino";

export type RequestLog = {
  requestId: string;
  log: Logger;
};

/**
 * Returns the requestId from the middleware (x-request-id) and a child logger bound to it.
 * Optionally pass a `meta` object to bind more fields (e.g., route or userId).
 */
export async function getRequestLog(
  meta?: Record<string, unknown>
): Promise<RequestLog> {
  const h = await headers();
  const requestId = h.get("x-request-id") ?? createId();

  const log = logger.child({ requestId, ...(meta ?? {}) });
  return { requestId, log };
}
