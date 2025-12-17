"use client";

import { usePostDetailsModalNavigation } from "../../hooks";
import { PostDetailsModal } from "../PostDetailsModal";

export function PostDetailsModalLayer() {
  const { currentPostId, isPostDetailsOpen, closePostDetails } =
    usePostDetailsModalNavigation();

  if (!isPostDetailsOpen || !currentPostId) {
    return null;
  }

  return (
    <PostDetailsModal
      postId={currentPostId}
      open={isPostDetailsOpen}
      onClose={closePostDetails}
    />
  );
}
