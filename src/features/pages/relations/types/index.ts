import { FriendRequestStatus, FollowRequestStatus } from "@prisma/client";

export const RELATION_TABS = [
  "followers",
  "following",
  "follow-requests",
  "sent-follow-requests",
  "friends",
  "friend-requests",
  "sent-friend-requests",
  "blocked",
] as const;

export type RelationTab = (typeof RELATION_TABS)[number];

export type RelationUserSummary = {
  id: string;
  username: string;
  name: string;
  avatarUrl: string | null;
  bio: string | null;
};

export type RelationListItem = {
  id: string;
  tab: RelationTab;
  user: RelationUserSummary;
  createdAt: string;
  status?: FriendRequestStatus | FollowRequestStatus;
};

export function isRelationTab(value: unknown): value is RelationTab {
  return (
    typeof value === "string" &&
    (RELATION_TABS as readonly string[]).includes(value)
  );
}

export type FetchRelationsInput = {
  userId: string;
  tab: RelationTab;
  limit: number;
  cursor?: string;
};

export type RelationsListResult = {
  items: RelationListItem[];
  nextCursor: string | null;
  hasNextPage: boolean;
};
