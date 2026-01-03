import { logger } from "@/lib/logger";
import {
  buildProfileSummary,
  buildViewerAwareProfile,
  derivePrivacyState,
} from "@/features/pages/profile/utils";
import { resolveViewerRelations } from "@/features/pages/profile/services/server";
import type {
  ProfileRouteData,
  ProfileUserRecord,
} from "@/features/pages/profile/types";

export async function processProfileView({
  user,
  viewerId,
  requestId,
  route,
}: {
  user: ProfileUserRecord;
  viewerId: string;
  requestId: string;
  route: string;
}): Promise<{
  payload: ProfileRouteData;
  shouldRecordInteraction: boolean;
}> {
  const log = logger.child({ requestId, route });

  // Resolve viewer relations and privacy
  const relations = await resolveViewerRelations(viewerId, user.id);
  const privacy = derivePrivacyState(user, relations);

  // Check if profile is blocked
  if (privacy.restrictions?.reason === "PROFILE_BLOCKED") {
    log.warn(
      { username: user.username },
      "Profile hidden due to block relationship"
    );
    throw new Error("PROFILE_BLOCKED");
  }

  // Build profile data
  const summary = buildProfileSummary(user, privacy);
  const shapedProfile = buildViewerAwareProfile(summary, relations.isSelf);

  const payload: ProfileRouteData = {
    profile: shapedProfile,
    viewer: {
      canViewFullProfile: privacy.canViewFullProfile,
      ...relations,
    },
    restrictions: privacy.restrictions,
  };

  // Determine if we should record interaction (only for viewing others' profiles)
  const shouldRecordInteraction = Boolean(viewerId && viewerId !== user.id);

  log.info(
    {
      userId: user.id,
      viewerId,
      canViewFullProfile: privacy.canViewFullProfile,
    },
    "Profile view processed successfully"
  );

  return { payload, shouldRecordInteraction };
}
