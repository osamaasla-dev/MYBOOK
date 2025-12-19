import { decideModerationAction } from "@/features/parts/moderation/utils";
import { checkModerationSchema } from "@/features/parts/moderation/schemas/checkModerationSchema";
import {
  checkModeration,
  MissingModerationAPIKeyError,
  ModerationProviderError,
} from "@/features/parts/moderation/services";
import { apiResponse } from "@/lib/apiResponse";
import { normalizeError } from "@/lib/http/normalizeError";
import { moderationMessages } from "@/lib/messages";
import { getRequestLog } from "@/lib/request-log";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ROUTE = "/api/moderation/check";

export async function POST(request: Request) {
  const { requestId, log } = await getRequestLog({ route: ROUTE });

  try {
    log.info("moderation started");
    const body = await request.json();
    const parsed = checkModerationSchema.safeParse(body);

    if (!parsed.success) {
      const issue = parsed.error.issues?.[0];
      log.warn({ issues: parsed.error.issues }, "Moderation payload invalid");
      return apiResponse(
        false,
        null,
        issue?.message ?? moderationMessages.invalidPayload,
        400,
        requestId
      );
    }

    const outcome = await checkModeration(
      parsed.data.content,
      parsed.data.context
    );
    const decision = decideModerationAction(outcome.context, outcome.severity);
    log.info(
      {
        context: outcome.context,
        severity: outcome.severity,
        threshold: decision.threshold,
        status: decision.status,
      },
      "Moderation completed"
    );

    return apiResponse(
      true,
      outcome,
      moderationMessages.success,
      200,
      requestId
    );
  } catch (error: unknown) {
    if (error instanceof MissingModerationAPIKeyError) {
      return apiResponse(
        false,
        null,
        moderationMessages.missingKey,
        500,
        requestId
      );
    }
    if (error instanceof ModerationProviderError) {
      log.warn(
        {
          status: error.status,
          details: error.details,
        },
        "Moderation API provider error"
      );
      const friendlyMessage =
        error.status === 429
          ? moderationMessages.rateLimited
          : moderationMessages.failed;
      return apiResponse(false, null, friendlyMessage, error.status, requestId);
    }

    const err = normalizeError(error);
    const status = err.status ?? 500;
    const message = err.message ?? moderationMessages.failed;
    log.error({ err, status }, "Moderation handler failed");
    return apiResponse(false, null, message, status, requestId);
  }
}
