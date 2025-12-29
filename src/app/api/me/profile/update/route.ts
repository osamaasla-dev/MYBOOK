import { apiResponse } from "@/lib/apiResponse";
import { normalizeError } from "@/lib/http/normalizeError";
import profileMessages from "@/lib/messages/profile";
import { getRequestLog } from "@/lib/request-log";
import { ServerSession } from "@/utils/session";
import {
  MissingModerationAPIKeyError,
  ModerationProviderError,
  moderateImage,
  moderateText,
} from "@/features/parts/moderation/services";
import { consumeRateLimit } from "@/features/utils/rateLimit";
import { extractClientIp } from "@/features/parts/follow/utils/request";
import {
  PROFILE_UPDATE_RATE_NAMESPACE,
  PROFILE_UPDATE_RATE_WINDOW_SECONDS,
  PROFILE_UPDATE_RATE_MAX,
} from "@/features/pages/profile/constants";
import { updateProfileSchema } from "@/features/pages/profile/schemas";
import { updateUserProfile } from "@/features/pages/profile/services/server";
import { userMessages } from "@/lib/messages";
import { deleteProfileCache } from "@/features/pages/profile/utils";

const ROUTE = "/api/me/profile";

export async function PUT(request: Request) {
  const { requestId, log } = await getRequestLog({ route: ROUTE });

  try {
    log.info("profile update started");
    const session = await ServerSession();
    if (!session?.user?.id) {
      log.warn(userMessages.unauthorized);
      return apiResponse(
        false,
        null,
        userMessages.unauthorized,
        401,
        requestId
      );
    }

    // Rate limiting
    const clientIp = extractClientIp(request);
    const limited = await consumeRateLimit({
      namespace: PROFILE_UPDATE_RATE_NAMESPACE,
      identifiers: [
        { key: "user", value: session.user.id },
        { key: "ip", value: clientIp },
      ],
      windowSeconds: PROFILE_UPDATE_RATE_WINDOW_SECONDS,
      maxRequests: PROFILE_UPDATE_RATE_MAX,
    });

    if (limited) {
      log.warn(
        {
          userId: session.user.id,
          ip: clientIp,
        },
        profileMessages.update.rateLimitExceeded
      );
      return apiResponse(
        false,
        null,
        profileMessages.update.rateLimitExceeded,
        429,
        requestId
      );
    }

    const body = await request.json();
    const parsed = updateProfileSchema.safeParse(body);
    if (!parsed.success) {
      const firstIssue = parsed.error.issues?.[0];
      log.warn({ issues: parsed.error.issues }, "Invalid profile payload");
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
    try {
      if (bio && bio.trim().length > 0) {
        const decision = await moderateText(bio, "bio");
        if (decision.status === "reject") {
          log.warn(
            { userId: session.user.id, bio },
            profileMessages.update.bioBlocked
          );
          return apiResponse(
            false,
            null,
            profileMessages.update.bioBlocked,
            422,
            requestId
          );
        }
      }

      if (avatarUrl) {
        const decision = await moderateImage(avatarUrl, "avatar");
        if (decision.status === "reject") {
          log.warn(
            { userId: session.user.id, url: avatarUrl },
            profileMessages.update.avatarBlocked
          );
          return apiResponse(
            false,
            null,
            profileMessages.update.avatarBlocked,
            422,
            requestId
          );
        }
      }

      if (coverUrl) {
        const decision = await moderateImage(coverUrl, "cover");
        if (decision.status === "reject") {
          log.warn(
            { userId: session.user.id, url: coverUrl },
            profileMessages.update.coverBlocked
          );
          return apiResponse(
            false,
            null,
            profileMessages.update.coverBlocked,
            422,
            requestId
          );
        }
      }
    } catch (error) {
      if (error instanceof MissingModerationAPIKeyError) {
        log.error("Moderation key missing, rejecting profile update");
        return apiResponse(
          false,
          null,
          profileMessages.update.moderationUnavailable,
          500,
          requestId
        );
      }
      if (error instanceof ModerationProviderError) {
        log.warn(
          { status: error.status, details: error.details },
          "Moderation provider error while updating profile"
        );
        const friendlyMessage =
          error.status === 429
            ? "Too many requests. Please try again later."
            : "Content moderation service error";
        return apiResponse(
          false,
          null,
          friendlyMessage,
          error.status,
          requestId
        );
      }
      throw error;
    }

    // Update user profile
    await deleteProfileCache(session.user.username);
    const updatedUser = await updateUserProfile(session.user.id, parsed.data);

    log.info({ userId: session.user.id }, profileMessages.update.success);

    return apiResponse(
      true,
      updatedUser,
      profileMessages.update.success,
      200,
      requestId
    );
  } catch (error: unknown) {
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
