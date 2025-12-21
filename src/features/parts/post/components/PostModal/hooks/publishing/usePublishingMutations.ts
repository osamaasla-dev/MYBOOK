"use client";

import { useMutationState } from "@tanstack/react-query";

import { useMediaUpload } from "@/features/parts/media/hooks/useMediaUpload";
import {
  CREATE_POST_MUTATION_KEY,
  useCreatePost,
} from "@/features/parts/post/hooks/useCreatePost";

export function usePublishingMutations() {
  const mediaUploadMutation = useMediaUpload();
  const createPostMutation = useCreatePost();

  const createPostPendingStates = useMutationState({
    filters: {
      mutationKey: CREATE_POST_MUTATION_KEY,
      exact: true,
    },
    select: (mutation) => mutation.state.status === "pending",
  });

  const isPublishing =
    mediaUploadMutation.isPending || createPostPendingStates.some(Boolean);

  return {
    mediaUploadMutation,
    createPostMutation,
    isPublishing,
  };
}
