"use client";

import { PostDetailsModal } from "../PostDetailsModal";
import { usePostDetailsModalNavigation } from "../../hooks";

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
