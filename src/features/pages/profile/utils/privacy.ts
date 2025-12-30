import type {
  ProfilePrivacyState,
  ProfileSummary,
  ProfileUserRecord,
  ViewerRelations,
} from "../types";
import { profileMessages } from "@/lib/messages";

export function derivePrivacyState(
  user: ProfileUserRecord,
  relations: ViewerRelations
): ProfilePrivacyState {
  if (relations.isBlocked) {
    return {
      canViewFullProfile: false,
      visibility: "locked",
      restrictions: {
        reason: "PROFILE_BLOCKED",
        message: profileMessages.BLOCKED_PROFILE_MESSAGE,
      },
    };
  }

  const hasFullAccess =
    !user.isPrivate || relations.isSelf || relations.isFollowing;

  if (!hasFullAccess && relations.hasPendingFollowRequest) {
    return {
      canViewFullProfile: false,
      visibility: "locked",
      restrictions: {
        reason: "FOLLOW_REQUEST_PENDING",
        message: profileMessages.PENDING_FOLLOW_MESSAGE,
      },
    };
  }

  if (!hasFullAccess) {
    return {
      canViewFullProfile: false,
      visibility: "limited",
      restrictions: {
        reason: "PROFILE_PRIVATE",
        message: profileMessages.PRIVATE_PROFILE_MESSAGE,
      },
    };
  }

  return {
    canViewFullProfile: true,
    visibility: "public",
    restrictions: null,
  };
}

export function buildProfileSummary(
  user: ProfileUserRecord,
  privacy: ProfilePrivacyState
): ProfileSummary {
  const isPublic = privacy.visibility === "public";

  return {
    id: user.id,
    name: user.name,
    username: user.username,
    avatarUrl: user.avatarUrl,
    bio: privacy.canViewFullProfile ? user.bio : null,
    websiteUrl: privacy.canViewFullProfile ? user.websiteUrl : null,
    coverUrl: privacy.canViewFullProfile ? user.coverUrl : null,
    isPrivate: user.isPrivate,
    isVerified: user.isVerified,
    followersCount: isPublic ? user.followersCount : 0,
    followingCount: isPublic ? user.followingCount : 0,
    friendsCount: isPublic ? user.friendsCount : 0,
    postsCount: isPublic ? user.postsCount : 0,
    createdAt: user.createdAt,
    visibility: privacy.visibility,
  };
}

export function buildViewerAwareProfile(
  summary: ProfileSummary,
  isSelf: boolean
): ProfileSummary {
  if (isSelf) {
    return summary;
  }

  return {
    ...summary,
    websiteUrl: summary.visibility === "public" ? summary.websiteUrl : null,
    coverUrl: summary.visibility === "public" ? summary.coverUrl : null,
    followersCount:
      summary.visibility === "public" ? summary.followersCount : 0,
    followingCount:
      summary.visibility === "public" ? summary.followingCount : 0,
    friendsCount: summary.visibility === "public" ? summary.friendsCount : 0,
    postsCount: summary.visibility === "public" ? summary.postsCount : 0,
  };
}
