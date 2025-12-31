import type {
  NormalizedRankedUserRow,
  RankedUserRow,
} from "@/features/parts/search/types";

export type SearchCursorPayload = {
  priority: number;
  weight: number;
  name: string;
  id: string;
};

export function encodeCursor(payload: SearchCursorPayload): string {
  return Buffer.from(JSON.stringify(payload)).toString("base64");
}

export function decodeCursor(cursor: string): SearchCursorPayload | null {
  try {
    const raw = Buffer.from(cursor, "base64").toString("utf8");
    const parsed = JSON.parse(raw) as SearchCursorPayload;
    if (
      typeof parsed.priority === "number" &&
      typeof parsed.weight === "number" &&
      typeof parsed.name === "string" &&
      typeof parsed.id === "string"
    ) {
      return parsed;
    }
    return null;
  } catch {
    throw new Error("Invalid cursor");
  }
}

export function normalizeRankedUserRow(
  row: RankedUserRow
): NormalizedRankedUserRow {
  return {
    id: row.id,
    name: row.name,
    username: row.username,
    avatarUrl: row.avatarUrl,
    is_friend: Boolean(row.is_friend),
    is_following: Boolean(row.is_following),
    priority_bucket:
      typeof row.priority_bucket === "bigint"
        ? Number(row.priority_bucket)
        : row.priority_bucket,
    weight_sort:
      typeof row.weight_sort === "bigint"
        ? Number(row.weight_sort)
        : row.weight_sort,
    name_sort: row.name_sort,
  };
}
