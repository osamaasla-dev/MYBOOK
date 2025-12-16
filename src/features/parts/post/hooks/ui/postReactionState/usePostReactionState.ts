"use client";

import { useCallback } from "react";

import { useCurrentUser } from "@/features/hooks";
import { buildUserChannel } from "@/features/utils/realtime";
import { usePusherChannel } from "@/hooks/usePusherChannel";
import {
  POST_REACTION_EVENT,
  type PostReactionEventPayload,
} from "../../../events/postReactionEvent";
import type { PostReactionType } from "../../../constants/reactions";
import { useReactToPost } from "../../useReactToPost";
import { useRemovePostReaction } from "../../useRemovePostReaction";
import { adjustReactionSummary } from "./adjustReactionSummary";
import type {
  UsePostReactionStateOptions,
  UsePostReactionStateResult,
} from "./types";
import { useReactionStateRefs } from "./useReactionStateRefs";

export function usePostReactionState({
  postId,
  initialReaction = null,
  initialSummary,
}: UsePostReactionStateOptions): UsePostReactionStateResult {
  const { data: currentUser } = useCurrentUser();
  const {
    actionIdRef,
    resolvedActionIdRef,
    committedReactionRef,
    committedSummaryRef,
    optimisticReaction,
    setOptimisticReaction,
    optimisticSummary,
    setOptimisticSummary,
  } = useReactionStateRefs(initialReaction ?? null, initialSummary);

  const reactMutation = useReactToPost();
  const removeMutation = useRemovePostReaction();
  const channelName = currentUser?.id ? buildUserChannel(currentUser.id) : "";

  const handleRealtimeReaction = useCallback(
    (payload?: PostReactionEventPayload) => {
      if (!payload || payload.postId !== postId) return;

      setOptimisticSummary(() => {
        committedSummaryRef.current = payload.reactionSummary ?? null;
        return payload.reactionSummary ?? null;
      });
      // Placeholder for future stats syncing (comments, shares, etc.)
    },
    [committedSummaryRef, postId, setOptimisticSummary]
  );

  usePusherChannel<PostReactionEventPayload>({
    channelName,
    event: POST_REACTION_EVENT,
    enabled: Boolean(channelName),
    onEvent: handleRealtimeReaction,
  });

  const startAction = useCallback(() => {
    actionIdRef.current += 1;
    return actionIdRef.current;
  }, [actionIdRef]);

  const handleReact = useCallback(
    (reaction: PostReactionType) => {
      const actionId = startAction();
      const previousReaction = optimisticReaction;
      setOptimisticReaction(reaction);
      setOptimisticSummary((currentSummary) => {
        const baseSummary =
          currentSummary ?? committedSummaryRef.current ?? null;
        return adjustReactionSummary(baseSummary, previousReaction, reaction);
      });

      reactMutation.mutate(
        { postId, reaction, actionId },
        {
          onSuccess: (data, variables) => {
            if (variables.actionId !== actionIdRef.current) return;
            resolvedActionIdRef.current = variables.actionId ?? actionId;
            committedReactionRef.current = data.reaction;
            committedSummaryRef.current = data.reactionSummary ?? null;
            setOptimisticReaction(data.reaction);
            setOptimisticSummary(data.reactionSummary ?? null);
          },
          onError: (_, variables) => {
            if (variables.actionId !== actionIdRef.current) return;
            resolvedActionIdRef.current = variables.actionId ?? actionId;
            setOptimisticReaction(committedReactionRef.current);
            setOptimisticSummary(committedSummaryRef.current);
          },
        }
      );
    },
    [
      actionIdRef,
      committedReactionRef,
      committedSummaryRef,
      optimisticReaction,
      postId,
      reactMutation,
      resolvedActionIdRef,
      setOptimisticReaction,
      setOptimisticSummary,
      startAction,
    ]
  );

  const handleRemove = useCallback(() => {
    const actionId = startAction();
    const previousReaction = optimisticReaction;
    setOptimisticReaction(null);
    setOptimisticSummary((currentSummary) => {
      const baseSummary = currentSummary ?? committedSummaryRef.current ?? null;
      return adjustReactionSummary(baseSummary, previousReaction, null);
    });

    removeMutation.mutate(
      { postId, actionId },
      {
        onSuccess: (data, variables) => {
          if (variables.actionId !== actionIdRef.current) return;
          resolvedActionIdRef.current = variables.actionId ?? actionId;
          committedReactionRef.current = data.reaction;
          committedSummaryRef.current = data.reactionSummary ?? null;
          setOptimisticReaction(data.reaction);
          setOptimisticSummary(data.reactionSummary ?? null);
        },
        onError: (_, variables) => {
          if (variables.actionId !== actionIdRef.current) return;
          resolvedActionIdRef.current = variables.actionId ?? actionId;
          setOptimisticReaction(committedReactionRef.current);
          setOptimisticSummary(committedSummaryRef.current);
        },
      }
    );
  }, [
    actionIdRef,
    committedReactionRef,
    committedSummaryRef,
    optimisticReaction,
    postId,
    removeMutation,
    resolvedActionIdRef,
    setOptimisticReaction,
    setOptimisticSummary,
    startAction,
  ]);

  const handleReactionSelect = useCallback(
    (reaction: PostReactionType) => {
      if (optimisticReaction === reaction) {
        handleRemove();
        return;
      }

      handleReact(reaction);
    },
    [handleReact, handleRemove, optimisticReaction]
  );

  return {
    currentReaction: optimisticReaction,
    optimisticSummary,
    handleReactionSelect,
    handleRemove,
  };
}
