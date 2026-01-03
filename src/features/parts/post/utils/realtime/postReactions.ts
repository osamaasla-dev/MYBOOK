import { pusherServer } from "@/lib/pusher/server";
import { buildUserChannel } from "@/features/utils/ratelimit";
import type { PostReactionType } from "../../constants/reactions";
import type { ReactionOperation } from "../reaction";
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
};

export async function broadcastPostReactionEvent({
  postId,
  reaction,
  reactorId,
  reactorName,
  postAuthorId,
  operation,
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
  };

  await pusherServer.trigger(
    buildUserChannel(postAuthorId),
    POST_REACTION_EVENT,
    payload
  );
}
