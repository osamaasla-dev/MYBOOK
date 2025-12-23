import type { Logger } from "pino";

import { commentMessages } from "@/lib/messages";
import { isJsonRequest } from "@/schemas/http";
import {
  createCommentSchema,
  type CreateCommentInput,
} from "@/features/parts/postDetails/schemas";

import { CommentRouteError } from "../errors";

export async function parseCreateCommentPayload(
  request: Request,
  log: Logger
): Promise<CreateCommentInput> {
  if (!isJsonRequest(request)) {
    log.warn("Unsupported content-type for comment payload");
    throw new CommentRouteError(commentMessages.invalidPayload, 415);
  }

  let body: unknown;
  try {
    log.info("Parsing comment payload started");
    body = await request.json();
  } catch (error) {
    log.warn({ error }, "Failed to parse comment payload");
    throw new CommentRouteError(commentMessages.invalidPayload, 400);
  }

  const parsed = createCommentSchema.safeParse(body);
  if (!parsed.success) {
    const firstIssue = parsed.error.issues?.[0];
    log.warn({ issues: parsed.error.issues }, "Invalid comment payload");
    throw new CommentRouteError(
      firstIssue?.message ?? commentMessages.invalidPayload,
      400
    );
  }

  return parsed.data;
}
