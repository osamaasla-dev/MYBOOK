import { apiResponse } from "@/lib/apiResponse";
import profileMessages from "@/lib/messages/profile";
import type { Logger } from "pino";
import {
  MissingModerationAPIKeyError,
  ModerationProviderError,
  moderateImage,
  moderateText,
} from "@/features/parts/moderation/services/server";

export type ProfileModerationResult =
  | { ok: true }
  | { ok: false; response: Response };

export async function moderateProfileContent({
  bio,
  avatarUrl,
  coverUrl,
  userId,
  requestId,
  cleanupMedia,
  log,
}: {
  bio?: string;
  avatarUrl?: string | null;
  coverUrl?: string | null;
  userId: string;
  requestId: string;
  cleanupMedia: (reason: string) => Promise<void>;
  log: Logger;
}): Promise<ProfileModerationResult> {
  try {
    // Moderate bio text
    if (bio && bio.trim().length > 0) {
      const decision = await moderateText(bio, "bio");
      if (decision.status === "reject") {
        log.warn({ userId, bio }, profileMessages.update.bioBlocked);
        await cleanupMedia("profile-bio-moderation");
        return {
          ok: false,
          response: apiResponse(
            false,
            null,
            profileMessages.update.bioBlocked,
            422,
            requestId
          ),
        };
      }
    }

    // Moderate avatar image
    if (avatarUrl) {
      const decision = await moderateImage(avatarUrl, "avatar");
      if (decision.status === "reject") {
        log.warn(
          { userId, url: avatarUrl },
          profileMessages.update.avatarBlocked
        );
        await cleanupMedia("profile-avatar-moderation");
        return {
          ok: false,
          response: apiResponse(
            false,
            null,
            profileMessages.update.avatarBlocked,
            422,
            requestId
          ),
        };
      }
    }

    // Moderate cover image
    if (coverUrl) {
      const decision = await moderateImage(coverUrl, "cover");
      if (decision.status === "reject") {
        log.warn(
          { userId, url: coverUrl },
          profileMessages.update.coverBlocked
        );
        await cleanupMedia("profile-cover-moderation");
        return {
          ok: false,
          response: apiResponse(
            false,
            null,
            profileMessages.update.coverBlocked,
            422,
            requestId
          ),
        };
      }
    }

    return { ok: true };
  } catch (error) {
    if (error instanceof MissingModerationAPIKeyError) {
      log.error("Moderation key missing, rejecting profile update");
      await cleanupMedia("profile-missing-moderation-key");
      return {
        ok: false,
        response: apiResponse(
          false,
          null,
          profileMessages.update.moderationUnavailable,
          500,
          requestId
        ),
      };
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
      await cleanupMedia("profile-moderation-provider-error");
      return {
        ok: false,
        response: apiResponse(
          false,
          null,
          friendlyMessage,
          error.status,
          requestId
        ),
      };
    }

    throw error;
  }
}
