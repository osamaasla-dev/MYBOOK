export const FOLLOW_EVENTS = {
  APPROVED: "follow:approved",
  REJECTED: "follow:rejected",
  FOLLOWER_REMOVED: "follower:removed",
  FOLLOW_ADDED: "follow:added",
  FOLLOW_REQUESTED: "follow:requested",
  FOLLOW_REMOVED: "follow:removed",
} as const;

export type FollowEventName =
  (typeof FOLLOW_EVENTS)[keyof typeof FOLLOW_EVENTS];
