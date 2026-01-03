"use client";

import { useCallback, useState } from "react";

import { useDeletePostComment } from "@/features/parts/postDetails/hooks/useDeletePostComment";
import { useDeleteCommentReply } from "@/features/parts/postDetails/hooks/useDeleteReply";

type UseCommentActionsMenuArgs = {
  commentId: string;
  parentId: string | null;
  postId: string;
  viewerId: string | null;
  commentAuthorId: string;
  postAuthorId: string | null;
  onEdit?: () => void;
};

export function useCommentActionsMenu({
  commentId,
  parentId,
  postId,
  viewerId,
  commentAuthorId,
  postAuthorId,
  onEdit,
}: UseCommentActionsMenuArgs) {
  const isCommentOwner = viewerId === commentAuthorId;
  const canManage =
    Boolean(viewerId) && (isCommentOwner || viewerId === postAuthorId);

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const deleteMutation = useDeletePostComment({
    postId,
    parentId,
  });

  const deleteReplyMutation = useDeleteCommentReply({
    postId,
    parentId: parentId ?? "",
  });

  const isReply = Boolean(parentId);
  const activeMutation = isReply ? deleteReplyMutation : deleteMutation;

  const handleDelete = useCallback(async () => {
    try {
      await activeMutation.mutateAsync({ commentId });
    } catch {
      // handled by hook toast
    }
  }, [commentId, activeMutation]);

  const handleConfirmOpenChange = useCallback(
    (open: boolean) => {
      setIsConfirmOpen(open);
      if (open) {
        setIsMenuOpen(false);
      }
    },
    [setIsConfirmOpen]
  );

  const handleMenuOpenChange = useCallback((open: boolean) => {
    setIsMenuOpen(open);
  }, []);

  const handleEditSelect = useCallback(() => {
    setIsMenuOpen(false);
    onEdit?.();
  }, [onEdit]);

  const handleDeleteSelect = useCallback(() => {
    handleConfirmOpenChange(true);
  }, [handleConfirmOpenChange]);

  return {
    canManage,
    isCommentOwner,
    isMenuOpen,
    isConfirmOpen,
    isDeleting: activeMutation.isPending,
    handleMenuOpenChange,
    handleConfirmOpenChange,
    handleEditSelect,
    handleDeleteSelect,
    handleDelete,
  };
}
