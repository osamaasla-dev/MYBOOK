import { pusherServer } from "@/lib/pusher/server";
import { buildUserChannel } from "@/features/utils/realtime";

export type FollowRealtimeKind =
  | "follow"
  | "unfollow"
  | "follow-request"
  | "follow-request-approved"
  | "follow-request-rejected"
  | "follow-request-canceled"
  | "follower-removed";

export type FollowRealtimePayload = {
  followerId: string;
  followerUsername: string;
  followerName?: string;
  targetId: string;
  targetUsername: string;
  targetName?: string;
  kind: FollowRealtimeKind;
  followersDelta: number;
  requestId?: string;
};

export type FollowRealtimeEvent =
  | "follow:added"
  | "follow:removed"
  | "follow:requested"
  | "follow:approved"
  | "follow:rejected"
  | "follow:canceled"
  | "follower:removed";

export type BroadcastFollowInput = FollowRealtimePayload & {
  event: FollowRealtimeEvent;
};

export async function broadcastFollowEvent(input: BroadcastFollowInput) {
  const { targetId, event, ...rest } = input;

  if (!targetId) return;

  const payload: FollowRealtimePayload = {
    targetId,
    ...rest,
    followersDelta: ["follow", "unfollow"].includes(rest.kind)
      ? rest.followersDelta
      : 0,
  };

  await pusherServer.trigger(buildUserChannel(targetId), event, payload);
}
