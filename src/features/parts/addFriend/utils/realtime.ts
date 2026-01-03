import { pusherServer } from "@/lib/pusher/server";
import { buildUserChannel } from "@/features/utils/ratelimit";

export type FriendRealtimeKind =
  | "friend-request"
  | "friend-request-canceled"
  | "friend-request-accepted"
  | "friend-request-rejected"
  | "friend-remove";

export type FriendRealtimePayload = {
  requesterId: string;
  requesterUsername: string;
  requesterName?: string;
  targetId: string;
  targetUsername: string;
  targetName?: string;
  kind: FriendRealtimeKind;
  requestId: string;
};

export type FriendRealtimeEvent =
  | "friend:request"
  | "friend:canceled"
  | "friend:accepted"
  | "friend:rejected"
  | "friend:remove";

export type BroadcastFriendInput = FriendRealtimePayload & {
  event: FriendRealtimeEvent;
};

export async function broadcastFriendEvent(input: BroadcastFriendInput) {
  const { targetId, event, ...rest } = input;

  if (!targetId) return;

  await pusherServer.trigger(buildUserChannel(targetId), event, {
    targetId,
    ...rest,
  });
}
