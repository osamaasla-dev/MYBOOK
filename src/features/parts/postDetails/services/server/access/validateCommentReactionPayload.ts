import { apiResponse } from "@/lib/apiResponse";
import { commentMessages } from "@/lib/messages";
import type { Logger } from "pino";
import { parseReactionPayload } from "@/features/parts/post/utils/reaction";

export type ValidateCommentReactionPayloadResult =
  | { ok: true; data: Awaited<ReturnType<typeof parseReactionPayload>>["data"] }
  | { ok: false; response: Response };

export async function validateCommentReactionPayload({
  request,
  log,
  requestId,
}: {
  request: Request;
  log: Logger;
  requestId: string;
}): Promise<ValidateCommentReactionPayloadResult> {
  // Check content type
  const contentType = request.headers.get("content-type");
  if (!contentType?.includes("application/json")) {
    log.warn("Unsupported content-type for comment reaction payload");
    return {
      ok: false,
      response: apiResponse(
        false,
        null,
        commentMessages.invalidPayload,
        415,
        requestId
      ),
    };
  }

  // Parse and validate body
  let body: unknown;
  try {
    body = await request.json();
  } catch (error) {
    log.warn({ error }, "Failed to parse comment reaction payload as JSON");
    return {
      ok: false,
      response: apiResponse(
        false,
        null,
        commentMessages.invalidPayload,
        400,
        requestId
      ),
    };
  }

  const parsed = parseReactionPayload(body);
  if (!parsed.success) {
    const firstIssue = parsed.error.issues?.[0];
    log.warn(
      { issues: parsed.error.issues },
      "Invalid comment reaction payload"
    );
    return {
      ok: false,
      response: apiResponse(
        false,
        null,
        firstIssue?.message ?? commentMessages.invalidPayload,
        400,
        requestId
      ),
    };
  }

  return {
    ok: true,
    data: parsed.data,
  };
}
