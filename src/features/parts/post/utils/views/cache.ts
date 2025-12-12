import { redis } from "@/lib/redis";
import type { Logger } from "pino";

import { POST_VIEWS_QUEUE_KEY } from "./constants";

export type PendingPostViewEntry = {
  postId: string;
  viewerId: string | null;
  sessionHash: string | null;
  ip: string | null;
  countryCode: string | null;
  userAgent: string | null;
  recordedAt: number;
};

export async function enqueuePendingPostView(
  payload: PendingPostViewEntry,
  log?: Logger
): Promise<void> {
  if (!payload.postId) return;

  try {
    await redis.rpush(POST_VIEWS_QUEUE_KEY, JSON.stringify(payload));
  } catch (error) {
    log?.error({ payload, error }, "enqueuePendingPostView failed");
  }
}

export async function readPendingPostViews(
  log?: Logger
): Promise<PendingPostViewEntry[]> {
  try {
    const records = await redis.lrange(POST_VIEWS_QUEUE_KEY, 0, -1);
    if (!records?.length) {
      return [];
    }

    const events: PendingPostViewEntry[] = [];
    for (const item of records) {
      try {
        const parsed =
          typeof item === "string"
            ? (JSON.parse(item) as PendingPostViewEntry)
            : (item as PendingPostViewEntry);

        if (parsed?.postId) {
          events.push(parsed);
        } else {
          log?.warn(
            { item, parsed, itemType: typeof item },
            "Discarded post view event without postId"
          );
        }
      } catch (parseError) {
        log?.error(
          {
            item,
            parseError:
              parseError instanceof Error
                ? { message: parseError.message, stack: parseError.stack }
                : parseError,
            itemType: typeof item,
          },
          "Failed to parse post view event"
        );
      }
    }
    return events;
  } catch (error) {
    log?.error({ error }, "readPendingPostViews failed");
    return [];
  }
}

export async function clearPendingPostViews(log?: Logger): Promise<void> {
  try {
    await redis.del(POST_VIEWS_QUEUE_KEY);
  } catch (error) {
    log?.error({ error }, "clearPendingPostViews failed");
  }
}

export async function consumePendingPostViews(
  log?: Logger
): Promise<PendingPostViewEntry[]> {
  const entries = await readPendingPostViews(log);
  if (!entries.length) {
    return [];
  }

  await clearPendingPostViews(log);
  return entries;
}
