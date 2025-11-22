import { z } from "zod";

export const DEFAULT_NOTIFICATIONS_LIMIT = 10;
export const MAX_NOTIFICATIONS_LIMIT = 10;

const clampLimit = (value: number) =>
  Math.min(Math.max(value, 1), MAX_NOTIFICATIONS_LIMIT);

export const notificationListQuerySchema = z.object({
  limit: z.preprocess((value) => {
    if (typeof value === "number" && Number.isFinite(value)) {
      return clampLimit(value);
    }

    if (typeof value === "string" && value.trim().length > 0) {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) {
        return clampLimit(parsed);
      }
    }

    return undefined;
  }, z.number().int().min(1).max(MAX_NOTIFICATIONS_LIMIT).default(DEFAULT_NOTIFICATIONS_LIMIT)),
  cursor: z.preprocess(
    (value) =>
      typeof value === "string" && value.trim().length > 0
        ? value.trim()
        : undefined,
    z.string().optional()
  ),
  unreadOnly: z.preprocess((value) => {
    if (typeof value === "boolean") return value;
    if (typeof value === "string") {
      if (value === "true") return true;
      if (value === "false") return false;
    }
    return undefined;
  }, z.boolean().default(false)),
});

export type NotificationListQuery = z.infer<typeof notificationListQuerySchema>;
