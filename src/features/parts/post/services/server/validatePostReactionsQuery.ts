import { apiResponse } from "@/lib/apiResponse";
import { genericMessages, userMessages } from "@/lib/messages";
import type { Logger } from "pino";
import { validateCuid } from "@/schemas/ids";
import {
  postReactionsQuerySchema,
  type PostReactionsQuery,
} from "./reactions/schema";

export type ValidatePostReactionsQueryResult =
  | { ok: true; postId: string; query: PostReactionsQuery }
  | { ok: false; response: Response };

export async function validatePostReactionsQuery({
  postId,
  searchParams,
  log,
  requestId,
}: {
  postId: string | undefined;
  searchParams: URLSearchParams;
  log: Logger;
  requestId: string;
}): Promise<ValidatePostReactionsQueryResult> {
  // Validate postId
  const validatedPostId = validateCuid(postId);
  if (!validatedPostId.success) {
    log.warn({ postId }, "Invalid postId parameter for reactions list");
    return {
      ok: false,
      response: apiResponse(
        false,
        {},
        userMessages.invalidParams,
        400,
        requestId
      ),
    };
  }

  // Parse and validate query parameters
  const parsedQuery = postReactionsQuerySchema.safeParse({
    postId: validatedPostId.data,
    tab: searchParams.get("tab") ?? undefined,
    limit: searchParams.get("limit") ?? undefined,
    cursor: searchParams.get("cursor") ?? undefined,
  });

  if (!parsedQuery.success) {
    const firstIssue = parsedQuery.error.issues?.[0];
    log.warn(
      { issues: parsedQuery.error.issues },
      "Invalid post reactions query parameters"
    );
    return {
      ok: false,
      response: apiResponse(
        false,
        {},
        firstIssue?.message ?? genericMessages.invalidParams,
        400,
        requestId
      ),
    };
  }

  return {
    ok: true,
    postId: validatedPostId.data,
    query: parsedQuery.data,
  };
}
