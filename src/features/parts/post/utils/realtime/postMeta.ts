import { buildUserChannel } from "@/features/utils/ratelimit";
import { pusherServer } from "@/lib/pusher/server";
import {
  POST_META_EVENT,
  type BroadcastPostMetaInput,
} from "../../events/postMetaEvent";
import { postRealtimeLogger } from "./logger";

export type BroadcastPostMetaOwnerInput = BroadcastPostMetaInput & {
  postAuthorId: string;
  initiatorId?: string | null;
};

export async function broadcastPostMetaEvent({
  postAuthorId,
  initiatorId,
  ...payload
}: BroadcastPostMetaOwnerInput) {
  const log = postRealtimeLogger.child({
    func: "broadcastPostMetaEvent",
    postId: payload.postId,
  });

  if (
    !payload.postId ||
    !postAuthorId ||
    (initiatorId && initiatorId === postAuthorId)
  ) {
    log.warn("Skipping post meta broadcast due to invalid inputs");
    return;
  }

  try {
    await pusherServer.trigger(
      buildUserChannel(postAuthorId),
      POST_META_EVENT,
      payload
    );
    log.debug("Broadcasted post meta event");
  } catch (error) {
    log.error({ error }, "Failed to broadcast post meta event");
  }
}
