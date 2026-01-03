import { pusherServer } from "@/lib/pusher/server";
import { buildUserChannel } from "@/features/utils/ratelimit";
import type {
  BlockRealtimePayload,
  BlockRealtimeEvent,
} from "../realtimeEvents";

export type BroadcastBlockInput = BlockRealtimePayload & {
  event: BlockRealtimeEvent;
};

export async function broadcastBlockEvent({
  blockedId,
  event,
  ...payload
}: BroadcastBlockInput) {
  if (!blockedId) return;

  await pusherServer.trigger(buildUserChannel(blockedId), event, {
    blockedId,
    ...payload,
  } satisfies BlockRealtimePayload);
}
