"use client";

import { useCallback } from "react";
import { useShallow } from "zustand/react/shallow";

import { useEditPostStore } from "@/stores/editPostStore";
import { FeedPostMedia } from "@/features/pages/home/utils/posts/feed-response";
import { Visibility, PostVisibilityPreference } from "@prisma/client";

export function useEditPostModal() {
  const {
    editingPostId,
    contentValue,
    visibility,
    visibilityPreference,
    setEditMode,
    reset,
  } = useEditPostStore(
    useShallow((state) => ({
      editingPostId: state.editingPostId,
      contentValue: state.contentValue,
      visibility: state.visibility,
      visibilityPreference: state.visibilityPreference,
      setEditMode: state.setEditMode,
      reset: state.reset,
    }))
  );

  const openEditModal = useCallback(
    (
      postId: string,
      content: string | null,
      media: FeedPostMedia[],
      visibility: Visibility,
      preference: PostVisibilityPreference
    ) => {
      setEditMode(true, postId, content ?? "", media, visibility, preference);
    },
    [setEditMode]
  );

  const closeEditModal = useCallback(() => {
    reset();
  }, [reset]);

  const isEditModalOpen = Boolean(editingPostId);

  return {
    isEditModalOpen,
    editingPostId,
    contentValue,
    visibility,
    visibilityPreference,
    openEditModal,
    closeEditModal,
  };
}
