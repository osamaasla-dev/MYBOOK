import type { UsePusherBinding } from "@/hooks/usePusherChannel";

import type { FriendRealtimePayload } from "../../utils/realtime";
import type { FriendRealtimeHandlers } from "./friendRealtimeHandlers";
import { FRIEND_EVENTS } from "./friendRealtimeEvents";

export type FriendRealtimeBinding = UsePusherBinding<FriendRealtimePayload>;

export function buildFriendRealtimeBindings(
  handlers: FriendRealtimeHandlers
): FriendRealtimeBinding[] {
  return [
    {
      event: FRIEND_EVENTS.REQUEST,
      onEvent: handlers.onFriendRequested,
    },
    {
      event: FRIEND_EVENTS.CANCELED,
      onEvent: handlers.onFriendCanceled,
    },
    {
      event: FRIEND_EVENTS.ACCEPTED,
      onEvent: handlers.onFriendAccepted,
    },
    {
      event: FRIEND_EVENTS.REJECTED,
      onEvent: handlers.onFriendRejected,
    },
    {
      event: FRIEND_EVENTS.REMOVED,
      onEvent: handlers.onFriendRemoved,
    },
  ];
}
