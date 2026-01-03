import { apiResponse } from "@/lib/apiResponse";
import { postMessages } from "@/lib/messages";
import type { Logger } from "pino";
import { createPostSchema } from "../../schemas";
import {
  deleteUploadedMediaInputs,
  extractUploadedMediaCandidates,
} from "./mediaCleanup";
import type { CreatePostInput } from "../../schemas";

export type ValidatePostPayloadResult =
  | {
      ok: true;
      data: CreatePostInput;
      cleanupMedia: (reason: string) => Promise<void>;
    }
  | { ok: false; response: Response };

export async function validatePostPayload({
  body,
  log,
  requestId,
  postId,
}: {
  body: unknown;
  log: Logger;
  requestId: string;
  postId?: string;
}): Promise<ValidatePostPayloadResult> {
  let uploadedMediaCleanupHandled = false;
  const uploadedMediaCandidates = extractUploadedMediaCandidates(body);

  const cleanupUploadedMedia = async (reason: string) => {
    if (uploadedMediaCleanupHandled || !uploadedMediaCandidates.length) return;
    uploadedMediaCleanupHandled = true;
    await deleteUploadedMediaInputs(uploadedMediaCandidates, log, {
      ...(postId && { postId }),
      reason,
    });
  };

  const parsed = createPostSchema.safeParse(body);
  if (!parsed.success) {
    const firstIssue = parsed.error.issues?.[0];
    log.warn({ issues: parsed.error.issues }, "Invalid post payload");
    await cleanupUploadedMedia("invalid-payload");
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
    cleanupMedia: cleanupUploadedMedia,
  };
}
