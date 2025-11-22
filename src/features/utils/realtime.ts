import { pusherServer } from "@/lib/pusher/server";

const USER_CHANNEL_PREFIX = "private-user-";

const buildUserChannel = (userId: string) => `${USER_CHANNEL_PREFIX}${userId}`;

type FollowRealtimePayload = {
  followerId: string;
  followerUsername: string;
  targetId: string;
  targetUsername: string;
};

type FollowRealtimeEvent = "follow:added" | "follow:removed";

type BroadcastFollowInput = {
  event: FollowRealtimeEvent;
} & FollowRealtimePayload;

export async function broadcastFollowEvent({
  event,
  followerId,
  followerUsername,
  targetId,
  targetUsername,
}: BroadcastFollowInput) {
  const payload: FollowRealtimePayload = {
    followerId,
    followerUsername,
    targetId,
    targetUsername,
  };

  await pusherServer.trigger(buildUserChannel(targetId), event, payload);
}
