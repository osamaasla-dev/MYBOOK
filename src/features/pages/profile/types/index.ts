import z from "zod";

export type ProfileViewerContext = {
  isAuthenticated: boolean;
  isSelf: boolean;
  isFollowing: boolean;
  isFollower: boolean;
  canViewFullProfile: boolean;
  isBlocked: boolean;
  hasPendingFollowRequest: boolean;
  isFriend: boolean;
  hasIncomingFriendRequest: boolean;
  hasOutgoingFriendRequest: boolean;
};

export type ViewerRelations = Pick<
  ProfileViewerContext,
  | "isSelf"
  | "isFollowing"
  | "isFollower"
  | "isBlocked"
  | "hasPendingFollowRequest"
  | "isFriend"
  | "hasIncomingFriendRequest"
  | "hasOutgoingFriendRequest"
>;

export type ProfileUserRecord = {
  id: string;
  name: string;
  username: string;
  avatarUrl: string | null;
  bio: string | null;
  websiteUrl: string | null;
  coverUrl: string | null;
  isPrivate: boolean;
  isVerified: boolean;
  followersCount: number;
  followingCount: number;
  friendsCount: number;
  postsCount: number;
  createdAt: Date;
};

export type ProfileSummary = Pick<
  ProfileUserRecord,
  | "name"
  | "username"
  | "avatarUrl"
  | "bio"
  | "websiteUrl"
  | "coverUrl"
  | "isPrivate"
  | "isVerified"
  | "followersCount"
  | "followingCount"
  | "friendsCount"
  | "postsCount"
  | "createdAt"
> & {
  visibility: "public" | "limited" | "locked";
};

export type ProfilePrivacyState = {
  canViewFullProfile: boolean;
  visibility: "public" | "limited" | "locked";
  restrictions: {
    reason: "PROFILE_PRIVATE" | "FOLLOW_REQUEST_PENDING" | "PROFILE_BLOCKED";
    message: string;
  } | null;
};

export type ProfileRouteData = {
  profile: ProfileSummary;
  viewer: ProfileViewerContext;
  restrictions: ProfilePrivacyState["restrictions"];
};
export const usernameSchema = z
  .string()
  .min(3)
  .max(32)
  .regex(/^[a-zA-Z0-9._-]+$/);
