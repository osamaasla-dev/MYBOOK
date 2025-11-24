import { z } from "zod";

import { RELATION_TABS, type RelationTab } from "../types";

export const DEFAULT_RELATIONS_LIMIT = 20;
export const MAX_RELATIONS_LIMIT = 20;

export const clampLimit = (value: number) =>
  Math.max(1, Math.min(value, MAX_RELATIONS_LIMIT));

const relationQuerySchema = z.object({
  tab: z
    .custom<RelationTab>(
      (val) =>
        typeof val === "string" &&
        (RELATION_TABS as readonly string[]).includes(val)
    )
    .transform((val) => val as RelationTab)
    .default(RELATION_TABS[0]),
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
  }, z.number().int().min(1).max(MAX_RELATIONS_LIMIT).default(DEFAULT_RELATIONS_LIMIT)),
  cursor: z.preprocess(
    (value) =>
      typeof value === "string" && value.trim().length > 0
        ? value.trim()
        : undefined,
    z.string().optional()
  ),
});

export type ParsedRelationsQuery = z.infer<typeof relationQuerySchema>;

export function parseRelationsQuery(
  searchParams: URLSearchParams
): { ok: true; value: ParsedRelationsQuery } | { ok: false; message: string } {
  const parsed = relationQuerySchema.safeParse(
    Object.fromEntries(searchParams)
  );

  if (!parsed.success) {
    return { ok: false, message: parsed.error.message };
  }

  return { ok: true, value: parsed.data };
}
