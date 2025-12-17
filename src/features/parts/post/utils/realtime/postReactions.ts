import { pusherServer } from "@/lib/pusher/server";
import { buildUserChannel } from "@/features/utils/realtime";
import type { PostReactionType } from "../../constants/reactions";
import type { ReactionOperation, ReactionSummary } from "../reaction";
import {
  POST_REACTION_EVENT,
  type PostReactionEventPayload,
} from "../../events/postReactionEvent";
import { postRealtimeLogger } from "./logger";

export type BroadcastPostReactionInput = {
  postId: string;
  reaction: PostReactionType;
  reactorId: string;
  reactorName: string;
  postAuthorId: string;
  operation: ReactionOperation;
  reactionSummary: ReactionSummary | null;
  reactionsCount: number;
};

export async function broadcastPostReactionEvent({
  postId,
  reaction,
  reactorId,
  reactorName,
  postAuthorId,
  operation,
  reactionSummary,
  reactionsCount,
}: BroadcastPostReactionInput) {
  const log = postRealtimeLogger.child({
    func: "broadcastPostReactionEvent",
    postId,
    reactorId,
  });

  if (
    !postId ||
    !reaction ||
    !reactorId ||
    !postAuthorId ||
    reactorId === postAuthorId
  ) {
    log.warn("Skipping reaction broadcast due to invalid inputs");
    return;
  }

  const payload: PostReactionEventPayload = {
    postId,
    reaction,
    reactorId,
    reactorName,
    operation,
    reactionSummary,
    reactionsCount,
  };

  try {
    await pusherServer.trigger(
      buildUserChannel(postAuthorId),
      POST_REACTION_EVENT,
      payload
    );

    log.debug("Broadcasted post reaction event");
  } catch (error) {
    log.error({ error }, "Failed to broadcast post reaction event");
  }
}
