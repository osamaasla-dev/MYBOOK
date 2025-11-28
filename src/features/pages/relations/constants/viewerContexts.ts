import type { ProfileRouteData } from "@/features/pages/profile/types";

export const SENT_REQUEST_VIEWER_CONTEXT: ProfileRouteData["viewer"] = {
  isAuthenticated: true,
  isSelf: false,
  isFollowing: false,
  isFollower: false,
  canViewFullProfile: false,
  isBlocked: false,
  hasPendingFollowRequest: true,
  isFriend: false,
  hasIncomingFriendRequest: false,
  hasOutgoingFriendRequest: false,
};

export const FOLLOWING_VIEWER_CONTEXT: ProfileRouteData["viewer"] = {
  isAuthenticated: true,
  isSelf: false,
  isFollowing: true,
  isFollower: false,
  canViewFullProfile: true,
  isBlocked: false,
  hasPendingFollowRequest: false,
  isFriend: false,
  hasIncomingFriendRequest: false,
  hasOutgoingFriendRequest: false,
};

export const FRIEND_VIEWER_CONTEXT: ProfileRouteData["viewer"] = {
  isAuthenticated: true,
  isSelf: false,
  isFollowing: true,
  isFollower: true,
  canViewFullProfile: true,
  isBlocked: false,
  hasPendingFollowRequest: false,
  isFriend: true,
  hasIncomingFriendRequest: false,
  hasOutgoingFriendRequest: false,
};

export const SENT_FRIEND_REQUEST_VIEWER_CONTEXT: ProfileRouteData["viewer"] = {
  isAuthenticated: true,
  isSelf: false,
  isFollowing: false,
  isFollower: false,
  canViewFullProfile: false,
  isBlocked: false,
  hasPendingFollowRequest: false,
  isFriend: false,
  hasIncomingFriendRequest: false,
  hasOutgoingFriendRequest: true,
};
