import { apiResponse } from "@/lib/apiResponse";
import { normalizeError } from "@/lib/http/normalizeError";
import profileMessages from "@/lib/messages/profile";
import { getRequestLog } from "@/lib/request-log";
import { validateSession } from "@/features/services/server";
import { checkRateLimit } from "@/features/parts/ratelimit/services";
import {
  PROFILE_UPDATE_RATE_NAMESPACE,
  PROFILE_UPDATE_RATE_WINDOW_SECONDS,
  PROFILE_UPDATE_RATE_MAX,
} from "@/features/parts/ratelimit/constants";
import { updateProfileSchema } from "@/features/pages/profile/schemas";
import {
  deleteUploadedProfileMedia,
  extractUploadedProfileMedia,
  moderateProfileContent,
  processProfileUpdate,
} from "@/features/pages/profile/services/server";

const ROUTE = "/api/me/profile";

export async function PUT(request: Request) {
  const { requestId, log } = await getRequestLog({ route: ROUTE });
  let cleanupUploadedMedia: ((reason: string) => Promise<void>) | null = null;
  let uploadedMediaCleanupHandled = false;
  let uploadedPublicIds: string[] = [];

  try {
    log.info("profile update started");
    const session = await validateSession(log, requestId);
    if (!session.ok) return session.response;
    const viewer = session.user;

    // Rate limiting
    const limited = await checkRateLimit({
      namespace: PROFILE_UPDATE_RATE_NAMESPACE,
      viewerId: viewer.id,
      windowSeconds: PROFILE_UPDATE_RATE_WINDOW_SECONDS,
      maxRequests: PROFILE_UPDATE_RATE_MAX,
      log,
      request,
      requestId,
    });

    if (!limited.ok) {
      return limited.response;
    }

    const body = await request.json();
    uploadedPublicIds = extractUploadedProfileMedia(body);
    cleanupUploadedMedia = async (reason: string) => {
      if (uploadedMediaCleanupHandled || !uploadedPublicIds.length) return;
      uploadedMediaCleanupHandled = true;
      await deleteUploadedProfileMedia(uploadedPublicIds, log, { reason });
    };

    const parsed = updateProfileSchema.safeParse(body);
    if (!parsed.success) {
      const firstIssue = parsed.error.issues?.[0];
      log.warn({ issues: parsed.error.issues }, "Invalid profile payload");
      await cleanupUploadedMedia("profile-invalid-payload");
      return apiResponse(
        false,
        null,
        firstIssue?.message ?? profileMessages.update.invalidPayload,
        400,
        requestId
      );
    }

    const { bio, avatarUrl, coverUrl } = parsed.data;

    // Moderate content if provided
    const moderationResult = await moderateProfileContent({
      bio,
      avatarUrl,
      coverUrl,
      userId: viewer.id,
      requestId,
      cleanupMedia: cleanupUploadedMedia,
      log,
    });

    if (!moderationResult.ok) {
      return moderationResult.response;
    }

    // Update user profile
    const updatedUser = await processProfileUpdate({
      viewer,
      profileData: parsed.data,
      log,
    });

    return apiResponse(
      true,
      updatedUser,
      profileMessages.update.success,
      200,
      requestId
    );
  } catch (error: unknown) {
    if (cleanupUploadedMedia) {
      await cleanupUploadedMedia("profile-unexpected-error");
    }
    const err = normalizeError(error);
    log.error(
      { err, status: err.status },
      err.message ?? profileMessages.update.failed
    );
    return apiResponse(
      false,
      null,
      err.message ?? profileMessages.update.failed,
      err.status ?? 500,
      requestId
    );
  }
}
