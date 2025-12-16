import { pusherServer } from "@/lib/pusher/server";
import { buildUserChannel } from "@/features/utils/realtime";
import type { PostReactionType } from "../constants/reactions";
import type { ReactionOperation, ReactionSummary } from "../utils/reaction";
import {
  POST_REACTION_EVENT,
  type PostReactionEventPayload,
} from "../events/postReactionEvent";

const POST_CREATED_EVENT = "post:created";

export type BroadcastPostCreatedInput = {
  postId: string;
  authorId: string;
  authorName: string;
  recipientIds: string[];
};

export async function broadcastPostCreatedEvent({
  postId,
  authorId,
  authorName,
  recipientIds,
}: BroadcastPostCreatedInput) {
  if (!postId || !authorId || !recipientIds.length) return;

  const payload = {
    event: POST_CREATED_EVENT,
    postId,
    authorId,
    authorName,
  };

  const triggers = recipientIds.map((recipientId) =>
    pusherServer.trigger(
      buildUserChannel(recipientId),
      POST_CREATED_EVENT,
      payload
    )
  );

  await Promise.allSettled(triggers);
}

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
  if (
    !postId ||
    !reaction ||
    !reactorId ||
    !postAuthorId ||
    reactorId === postAuthorId
  ) {
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

  await pusherServer.trigger(
    buildUserChannel(postAuthorId),
    POST_REACTION_EVENT,
    payload
  );
}
