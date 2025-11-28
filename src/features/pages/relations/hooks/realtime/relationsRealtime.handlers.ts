import type { RelationTab } from "../../types";
import {
  FOLLOW_REQUEST_TABS,
  FOLLOW_TABS,
  FRIEND_REQUEST_TABS,
  FRIEND_TABS,
} from "./relationsRealtime.constants";

type TabList = RelationTab[];

export const FOLLOW_HANDLER_TAB_MAP = {
  requestUpdate: FOLLOW_REQUEST_TABS,
  followersAdded: ["followers"] as TabList,
  followersRemoved: ["followers"] as TabList,
  followingUpdate: ["following"] as TabList,
} as const;

export const FRIEND_HANDLER_TAB_MAP = {
  requestUpdate: FRIEND_REQUEST_TABS,
  friendshipAccepted: [
    ...FRIEND_TABS,
    ...FRIEND_REQUEST_TABS,
    ...FOLLOW_TABS,
  ] as TabList,
  friendshipRemoved: [...FRIEND_TABS, ...FOLLOW_TABS] as TabList,
} as const;

export type FollowHandlerKey = keyof typeof FOLLOW_HANDLER_TAB_MAP;
export type FriendHandlerKey = keyof typeof FRIEND_HANDLER_TAB_MAP;
