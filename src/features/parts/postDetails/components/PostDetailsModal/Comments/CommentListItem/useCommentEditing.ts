"use client";

import { useCallback, useState } from "react";

import { useUpdatePostComment } from "@/features/parts/postDetails/hooks/useUpdatePostComment";
import { useUpdateReply } from "@/features/parts/postDetails/hooks/useUpdateReply";

type UseCommentEditingArgs = {
  commentId: string;
  parentId: string | null;
  postId: string;
};

export function useCommentEditing({
  commentId,
  parentId,
  postId,
}: UseCommentEditingArgs) {
  const [isEditing, setIsEditing] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const updateCommentMutation = useUpdatePostComment({
    postId,
    parentId: null,
  });

  const updateReplyMutation = useUpdateReply({
    postId,
    parentId: parentId ?? "",
  });

  const activeMutation = parentId ? updateReplyMutation : updateCommentMutation;

  const handleEdit = useCallback(() => {
    setEditError(null);
    setIsEditing(true);
  }, []);

  const handleCancelEdit = useCallback(() => {
    setEditError(null);
    setIsEditing(false);
  }, []);

  const handleSave = useCallback(
    async (content: string) => {
      try {
        setEditError(null);
        await activeMutation.mutateAsync({
          commentId,
          content,
        });
        setIsEditing(false);
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : activeMutation.error?.message ?? "Failed to update comment.";
        setEditError(message);
      }
    },
    [activeMutation, commentId]
  );

  return {
    isEditing,
    editError,
    isEditPending: activeMutation.isPending,
    handleEdit,
    handleCancelEdit,
    handleSave,
  };
}
