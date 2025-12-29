// app/api/media/upload/route.ts
import { apiResponse } from "@/lib/apiResponse";
import { normalizeError } from "@/lib/http/normalizeError";
import { uploadMessages } from "@/lib/messages";
import { getRequestLog } from "@/lib/request-log";
import { ServerSession } from "@/utils/session";
import { handleMediaUpload } from "@/features/parts/media/utils/handleMediaUpload";
import { isMediaUploadError } from "@/features/parts/media/utils/errors";

// Ensure Node.js runtime (Buffer is required). Avoid Edge runtime here.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ROUTE = "/api/media/upload";

export async function POST(req: Request) {
  const { requestId, log } = await getRequestLog({ route: ROUTE });
  try {
    log.info("Media upload started");
    const session = await ServerSession();
    const result = await handleMediaUpload({ req, session, log, requestId });
    if (result.error) return result.error;
    return apiResponse(true, result, uploadMessages.success, 200, requestId);
  } catch (error: unknown) {
    if (isMediaUploadError(error)) {
      log.warn(
        { status: error.statusCode, messageKey: error.messageKey },
        "Media upload rejected"
      );
      return apiResponse(
        false,
        null,
        error.message,
        error.statusCode,
        requestId
      );
    }

    const err = normalizeError(error);
    const message = err.message ?? uploadMessages.failed;
    log.error({ err, status: err.status }, "Media upload failed");
    return apiResponse(false, null, message, err.status ?? 500, requestId);
  }
}
