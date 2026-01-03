import { apiResponse } from "@/lib/apiResponse";
import { postMessages } from "@/lib/messages";
import type { Logger } from "pino";
import { parseReactionPayload } from "@/features/parts/post/utils/reaction";

export type ValidateReactionPayloadResult =
  | { ok: true; data: Awaited<ReturnType<typeof parseReactionPayload>>["data"] }
  | { ok: false; response: Response };

export async function validateReactionPayload({
  request,
  log,
  requestId,
}: {
  request: Request;
  log: Logger;
  requestId: string;
}): Promise<ValidateReactionPayloadResult> {
  // Parse and validate body
  let body: unknown;
  try {
    body = await request.json();
  } catch (error) {
    log.warn({ error }, "Failed to parse reaction payload as JSON");
    return {
      ok: false,
      response: apiResponse(
        false,
        null,
        postMessages.invalidPayload,
        400,
        requestId
      ),
    };
  }

  const parsed = parseReactionPayload(body);
  if (!parsed.success) {
    const firstIssue = parsed.error.issues?.[0];
    log.warn({ issues: parsed.error.issues }, "Invalid reaction payload");
    return {
      ok: false,
      response: apiResponse(
        false,
        null,
        firstIssue?.message ?? postMessages.invalidPayload,
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
