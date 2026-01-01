"use client";

import type { ReactNode } from "react";

import { FollowRequestActions } from "@/features/parts/follow/components/FollowRequestActions";
import { FollowButton } from "@/features/parts/follow/components/FollowButton";
import { RemoveFollowerButton } from "@/features/parts/follow/components/RemoveFollowerButton";
import { AcceptRejectFriendButtons } from "@/features/parts/addFriend/components/AcceptRejectFriendButtons";
import { FriendActionButton } from "@/features/parts/addFriend/components/FriendActionButton";

import type { RelationTab, RelationUserSummary } from "../types";
import {
  BLOCKED_VIEWER_CONTEXT,
  FRIEND_VIEWER_CONTEXT,
  FOLLOWING_VIEWER_CONTEXT,
  SENT_FRIEND_REQUEST_VIEWER_CONTEXT,
  SENT_REQUEST_VIEWER_CONTEXT,
} from "../constants/viewerContexts";
import { BlockButton } from "@/features/parts/block/components/BlockButton";

type RelationActionsProps = {
  tab: RelationTab;
  user: RelationUserSummary;
};

type ActionRenderer = (user: RelationUserSummary) => ReactNode;

const ACTION_RENDERERS: Partial<Record<RelationTab, ActionRenderer>> = {
  "follow-requests": (user) => (
    <FollowRequestActions
      username={user.username}
      className="w-full min-w-[160px]"
    />
  ),
  followers: (user) => <RemoveFollowerButton username={user.username} />,
  following: (user) => (
    <FollowButton
      viewer={FOLLOWING_VIEWER_CONTEXT}
      profileUsername={user.username}
      isBlocked={false}
    />
  ),
  "sent-follow-requests": (user) => (
    <FollowButton
      viewer={SENT_REQUEST_VIEWER_CONTEXT}
      profileUsername={user.username}
      isBlocked={false}
    />
  ),
  "friend-requests": (user) => (
    <AcceptRejectFriendButtons
      profileUsername={user.username}
      className="w-full"
    />
  ),
  friends: (user) => (
    <FriendActionButton
      viewer={FRIEND_VIEWER_CONTEXT}
      profileUsername={user.username}
      isBlocked={false}
    />
  ),
  "sent-friend-requests": (user) => (
    <FriendActionButton
      viewer={SENT_FRIEND_REQUEST_VIEWER_CONTEXT}
      profileUsername={user.username}
      isBlocked={false}
    />
  ),
  blocked: (user) => (
    <BlockButton
      viewer={BLOCKED_VIEWER_CONTEXT}
      profileUsername={user.username}
      className="w-full min-w-[120px]"
    />
  ),
};

export function RelationActions({ tab, user }: RelationActionsProps) {
  const renderAction = ACTION_RENDERERS[tab];
  return renderAction?.(user) ?? null;
}
