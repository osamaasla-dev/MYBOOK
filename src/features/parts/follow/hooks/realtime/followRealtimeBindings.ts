import type { UsePusherBinding } from "@/hooks/usePusherChannel";

import type { FollowRealtimePayload } from "../../utils/realtime";
import type { FollowRealtimeHandlers } from "./followRealtimeHandlers";
import { FOLLOW_EVENTS } from "./followRealtimeEvents";

export type FollowRealtimeBinding = UsePusherBinding<FollowRealtimePayload>;

export function buildFollowRealtimeBindings(
  handlers: FollowRealtimeHandlers
): FollowRealtimeBinding[] {
  return [
    {
      event: FOLLOW_EVENTS.APPROVED,
      onEvent: handlers.onFollowApproved,
    },
    {
      event: FOLLOW_EVENTS.REJECTED,
      onEvent: handlers.onFollowRejected,
    },
    {
      event: FOLLOW_EVENTS.FOLLOWER_REMOVED,
      onEvent: handlers.onFollowerRemoved,
    },
    {
      event: FOLLOW_EVENTS.FOLLOW_ADDED,
      onEvent: handlers.onFollowAdded,
    },
    {
      event: FOLLOW_EVENTS.FOLLOW_REMOVED,
      onEvent: handlers.onFollowRemoved,
    },
  ];
}
