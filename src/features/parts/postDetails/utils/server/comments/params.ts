import type { Logger } from "pino";

import { userMessages } from "@/lib/messages";
import { validateCuid } from "@/schemas/ids";

import {
  DEFAULT_LIMIT,
  MAX_LIMIT,
} from "@/features/parts/postDetails/constants";
import { CommentRouteError } from "./errors";

const INVALID_PARAMS_MESSAGE = userMessages.invalidParams;

export type CommentsQueryParams = {
  cursor: string | null;
  parentId: string | null;
  limit: number;
};

export function parseCommentsRouteParams(
  rawPostId: string | undefined,
  log: Logger
): string {
  const validatedPostId = validateCuid(rawPostId);
  if (!validatedPostId.success) {
    log.warn({ postId: rawPostId }, "Invalid postId parameter for comments");
    throw new CommentRouteError(INVALID_PARAMS_MESSAGE, 400);
  }
  return validatedPostId.data;
}

export function parseCommentsQueryParams(
  searchParams: URLSearchParams,
  log: Logger
): CommentsQueryParams {
  const cursor = parseOptionalCuid(searchParams.get("cursor"), "cursor", log);
  const parentId = parseOptionalCuid(
    searchParams.get("parentId"),
    "parentId",
    log
  );

  const limitParam = searchParams.get("limit");
  const limit = parseLimit(limitParam, log);

  return {
    cursor,
    parentId,
    limit,
  };
}

function parseOptionalCuid(
  value: string | null,
  field: string,
  log: Logger
): string | null {
  if (!value) {
    return null;
  }

  const validated = validateCuid(value);
  if (!validated.success) {
    log.warn({ value, field }, "Invalid comment query parameter");
    throw new CommentRouteError(INVALID_PARAMS_MESSAGE, 400);
  }

  return validated.data;
}

function parseLimit(limitParam: string | null, log: Logger): number {
  if (!limitParam) {
    return DEFAULT_LIMIT;
  }

  const parsedLimit = Number(limitParam);
  const isValid = Number.isFinite(parsedLimit) && parsedLimit > 0;

  if (!isValid) {
    log.warn({ limitParam }, "Invalid limit parameter for comments");
    throw new CommentRouteError(INVALID_PARAMS_MESSAGE, 400);
  }

  return Math.min(Math.max(parsedLimit, 1), MAX_LIMIT);
}
