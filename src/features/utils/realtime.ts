import { pusherServer } from "@/lib/pusher/server";

const USER_CHANNEL_PREFIX = "private-user-";

const buildUserChannel = (userId: string) => `${USER_CHANNEL_PREFIX}${userId}`;

export type FollowRealtimeKind =
  | "public-follow"
  | "public-unfollow"
  | "follow-request"
  | "follow-request-approved"
  | "follow-request-rejected";

export type FollowRealtimePayload = {
  followerId: string;
  followerUsername: string;
  targetId: string;
  targetUsername: string;
  kind: FollowRealtimeKind;
  followersDelta: number; // only used for public-follow/unfollow
  requestId?: string;
};

export type FollowRealtimeEvent =
  | "follow:added"
  | "follow:removed"
  | "follow:requested"
  | "follow:approved"
  | "follow:rejected";

type BroadcastFollowInput = FollowRealtimePayload & {
  event: FollowRealtimeEvent;
};

export async function broadcastFollowEvent(input: BroadcastFollowInput) {
  const { targetId, event, ...rest } = input;

  if (!targetId) return; // safety

  const payload: FollowRealtimePayload = {
    targetId,
    ...rest,
    followersDelta: ["public-follow", "public-unfollow"].includes(rest.kind)
      ? rest.followersDelta
      : 0,
  };

  await pusherServer.trigger(buildUserChannel(targetId), event, payload);
}
