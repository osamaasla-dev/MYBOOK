export const FRIEND_EVENTS = {
  REQUEST: "friend:request",
  CANCELED: "friend:canceled",
  ACCEPTED: "friend:accepted",
  REJECTED: "friend:rejected",
  REMOVED: "friend:remove",
} as const;

export type FriendEventKey = keyof typeof FRIEND_EVENTS;
export type FriendEventName = (typeof FRIEND_EVENTS)[FriendEventKey];
