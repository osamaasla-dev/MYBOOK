"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

import type { CreatePostInput } from "../schemas";
import { submitUpdatePost } from "../services/client";
import { postMessages } from "@/lib/messages";
import type { CreatePostResponseData } from "../types";
import {
  HOME_FEED_QUERY_KEY,
  type HomeFeedQueryData,
} from "@/features/pages/home/hooks/useHomeFeed";
import {
  cancelHomeFeedQuery,
  updatePostInFeedOptimistically,
  type UpdateMutationContext,
} from "./utils/updateMutationHelpers";
import { postDetailsQueryKey } from "../../postDetails/hooks/usePostDetails";

export const UPDATE_POST_MUTATION_KEY = ["posts", "update"] as const;

type UpdatePostPayload = {
  postId: string;
  input: CreatePostInput;
};

export function useUpdatePost() {
  const queryClient = useQueryClient();
  return useMutation<
    CreatePostResponseData,
    Error,
    UpdatePostPayload,
    UpdateMutationContext
  >({
    mutationKey: UPDATE_POST_MUTATION_KEY,
    mutationFn: ({ postId, input }) => submitUpdatePost(postId, input),
    onMutate: async () => {
      toast.dismiss();
      toast.loading("Updating post...");

      await cancelHomeFeedQuery(queryClient);

      const previousHomeFeed =
        queryClient.getQueryData<HomeFeedQueryData>(HOME_FEED_QUERY_KEY);

      return { previousHomeFeed };
    },
    onSuccess: async (updatedPostData, variables) => {
      toast.dismiss();
      toast.success(postMessages.update.success);

      // Update the post in the feed cache
      updatePostInFeedOptimistically(
        queryClient,
        variables.postId,
        updatedPostData
      );

      // Invalidate post details queries to ensure fresh data
      queryClient.invalidateQueries({
        queryKey: postDetailsQueryKey(variables.postId),
      });
    },
    onError: (error, _variables, context) => {
      toast.dismiss();
      toast.error(error.message ?? postMessages.update.failed);

      if (context?.previousHomeFeed) {
        queryClient.setQueryData(HOME_FEED_QUERY_KEY, context.previousHomeFeed);
      }
    },
  });
}
