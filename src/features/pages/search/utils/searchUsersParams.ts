import { ZodIssue } from "zod";
import {
  USER_SEARCH_RESULTS_DEFAULT_LIMIT,
  USER_SEARCH_RESULTS_MAX_LIMIT,
} from "../constants";
import { ParsedSearchUsersParams, searchUsersQuerySchema } from "../schemas";

export type ParseSearchUsersParamsResult =
  | { success: true; data: ParsedSearchUsersParams }
  | { success: false; issues: ZodIssue[]; message: string };

function parseLimit(value: string | null): number {
  if (!value) return USER_SEARCH_RESULTS_DEFAULT_LIMIT;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return USER_SEARCH_RESULTS_DEFAULT_LIMIT;
  }
  return Math.min(
    Math.max(Math.floor(parsed), 1),
    USER_SEARCH_RESULTS_MAX_LIMIT
  );
}

export function parseSearchUsersParams(
  searchParams: URLSearchParams
): ParseSearchUsersParamsResult {
  const rawParams = {
    query: searchParams.get("query") ?? "",
    limit: parseLimit(searchParams.get("limit")),
    cursor: searchParams.get("cursor") ?? undefined,
  };

  const parsed = searchUsersQuerySchema.safeParse(rawParams);

  if (!parsed.success) {
    const [firstIssue] = parsed.error.issues;
    return {
      success: false,
      issues: parsed.error.issues,
      message: firstIssue?.message ?? "Invalid search parameters",
    };
  }

  return { success: true, data: parsed.data };
}
