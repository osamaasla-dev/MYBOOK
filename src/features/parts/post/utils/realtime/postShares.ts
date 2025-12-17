import { pusherServer } from "@/lib/pusher/server";
import { buildUserChannel } from "@/features/utils/realtime";

import { POST_SHARE_EVENT } from "../../events/postShareEvent";
import type { ReactionSummary } from "../reaction";
import { postRealtimeLogger } from "./logger";

type PostShareOwnerEventPayload = {
  postId: string;
  shareAuthorId: string;
  reactionSummary: ReactionSummary | null;
};

export type BroadcastPostShareInput = PostShareOwnerEventPayload & {
  postAuthorId: string;
};

export async function broadcastPostShareEvent({
  postAuthorId,
  ...payload
}: BroadcastPostShareInput) {
  const { postId, shareAuthorId } = payload;

  const log = postRealtimeLogger.child({
    func: "broadcastPostShareEvent",
    postId,
    shareAuthorId,
  });

  if (
    !postId ||
    !shareAuthorId ||
    !postAuthorId ||
    shareAuthorId === postAuthorId
  ) {
    log.warn("Skipping share broadcast due to invalid inputs");
    return;
  }

  try {
    await pusherServer.trigger(
      buildUserChannel(postAuthorId),
      POST_SHARE_EVENT,
      payload
    );
    log.debug("Broadcasted post share event");
  } catch (error) {
    log.error({ error }, "Failed to broadcast post share event");
  }
}
