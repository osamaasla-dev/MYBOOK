import type { InteractionType, InteractionWeightKey } from "./types";

export const COUNTER_FIELD_MAP: Record<
  InteractionType,
  { counter: string; timestamp: string }
> = {
  like: {
    counter: "likesCount",
    timestamp: "lastLikeAt",
  },
  comment: {
    counter: "commentsCount",
    timestamp: "lastCommentAt",
  },
  message: {
    counter: "messagesCount",
    timestamp: "lastMessageAt",
  },
  profileVisit: {
    counter: "profileVisits",
    timestamp: "lastVisitAt",
  },
};

export const INTERACTION_WEIGHTS: Record<InteractionWeightKey, number> = {
  message: 5,
  comment: 3,
  like: 1,
  profileVisit: 0.5,
  friend: 10,
  follow: 5,
  unfriend: -15,
  unfollow: -7,
  hidePost: -5,
  report: -12,
  notInterested: -6,
  dislike: -1,
};
