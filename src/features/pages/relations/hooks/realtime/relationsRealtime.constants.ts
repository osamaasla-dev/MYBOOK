export { USER_CHANNEL_PREFIX } from "@/features/utils/realtime";
import { FRIEND_EVENTS } from "@/features/parts/addFriend/hooks/realtime/friendRealtimeEvents";

import type { RelationTab } from "../../types";

type Tabs = readonly RelationTab[];

const FOLLOW_REQUEST_TABS: Tabs = ["follow-requests", "sent-follow-requests"];

const FRIEND_REQUEST_TABS: Tabs = ["friend-requests", "sent-friend-requests"];

const FRIEND_TABS: Tabs = ["friends"];
const FOLLOW_TABS: Tabs = ["followers", "following"];

const FOLLOW_EVENTS = {
  REQUESTED: "follow:requested",
  CANCELED: "follow:canceled",
  APPROVED: "follow:approved",
  REJECTED: "follow:rejected",
  ADDED: "follow:added",
  REMOVED: "follow:removed",
  FOLLOWER_REMOVED: "follower:removed",
} as const;

export type RelationEventBinding = {
  event: string;
  tabs: Tabs;
};

export const FOLLOW_EVENT_CONFIG: readonly RelationEventBinding[] = [
  { event: FOLLOW_EVENTS.REQUESTED, tabs: FOLLOW_REQUEST_TABS },
  { event: FOLLOW_EVENTS.CANCELED, tabs: FOLLOW_REQUEST_TABS },
  { event: FOLLOW_EVENTS.APPROVED, tabs: FOLLOW_REQUEST_TABS },
  { event: FOLLOW_EVENTS.REJECTED, tabs: FOLLOW_REQUEST_TABS },
  { event: FOLLOW_EVENTS.ADDED, tabs: ["followers"] },
  { event: FOLLOW_EVENTS.REMOVED, tabs: ["followers"] },
  { event: FOLLOW_EVENTS.FOLLOWER_REMOVED, tabs: ["following"] },
] as const;

export const FRIEND_EVENT_CONFIG: readonly RelationEventBinding[] = [
  { event: FRIEND_EVENTS.REQUEST, tabs: FRIEND_REQUEST_TABS },
  { event: FRIEND_EVENTS.CANCELED, tabs: FRIEND_REQUEST_TABS },
  { event: FRIEND_EVENTS.REJECTED, tabs: FRIEND_REQUEST_TABS },
  {
    event: FRIEND_EVENTS.ACCEPTED,
    tabs: [...FRIEND_TABS, ...FRIEND_REQUEST_TABS, ...FOLLOW_TABS],
  },
  { event: FRIEND_EVENTS.REMOVED, tabs: [...FRIEND_TABS, ...FOLLOW_TABS] },
] as const;
