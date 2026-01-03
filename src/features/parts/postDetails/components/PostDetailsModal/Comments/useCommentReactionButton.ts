"use client";

import { useEffect, useRef, useState } from "react";

import {
  POST_REACTION_OPTIONS,
  type PostReactionType,
} from "@/features/parts/post/constants/reactions";

import { useReactToComment } from "../../../hooks/useReactToComment";
import { useReactToReply } from "../../../hooks/useReactToReply";
import { useRemoveCommentReaction } from "../../../hooks/useRemoveCommentReaction";
import { useRemoveReplyReaction } from "../../../hooks/useRemoveReplyReaction";

type UseCommentReactionButtonProps = {
  postId: string;
  commentId: string;
  parentId: string | null;
  viewerReaction: PostReactionType | null;
  disabled?: boolean;
};

export function useCommentReactionButton({
  postId,
  commentId,
  parentId,
  viewerReaction,
  disabled = false,
}: UseCommentReactionButtonProps) {
  const reactCommentMutation = useReactToComment({ postId, parentId });
  const reactToReplyMutation = useReactToReply({
    postId,
    parentId: parentId ?? "",
  });
  const removeCommentMutation = useRemoveCommentReaction({ postId, parentId });
  const removeReplyMutation = useRemoveReplyReaction({
    postId,
    parentId: parentId ?? "",
  });

  const isReply = Boolean(parentId);

  const activeReactMutation = isReply
    ? reactToReplyMutation
    : reactCommentMutation;

  const activeRemoveMutation = isReply
    ? removeReplyMutation
    : removeCommentMutation;

  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const pickerRef = useRef<HTMLDivElement | null>(null);

  const effectiveDisabled = disabled;

  useEffect(() => {
    if (!isPickerOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (pickerRef.current?.contains(event.target as Node)) {
        return;
      }
      setIsPickerOpen(false);
    };

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [isPickerOpen]);

  const togglePicker = () => {
    if (effectiveDisabled) return;
    setIsPickerOpen((prev) => !prev);
  };

  const selectReaction = (reactionId: PostReactionType) => {
    activeReactMutation.mutate({ commentId, reaction: reactionId });
    setIsPickerOpen(false);
  };

  const clearReaction = () => {
    activeRemoveMutation.mutate({ commentId });
    setIsPickerOpen(false);
  };

  const currentReaction = viewerReaction;
  const currentLabel = currentReaction
    ? POST_REACTION_OPTIONS.find((option) => option.id === currentReaction)
        ?.label ?? "React"
    : "React";

  return {
    pickerRef,
    isPickerOpen,
    togglePicker,
    selectReaction,
    clearReaction,
    effectiveDisabled,
    currentReaction,
    currentLabel,
  };
}
