"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

import { deletePostApi } from "../services/client/postApi";
import { postMessages } from "@/lib/messages";
import { HOME_FEED_QUERY_KEY } from "@/features/pages/home/hooks/useHomeFeed";
import { postDetailsQueryKey } from "@/features/parts/postDetails/hooks";
import { PROFILE_POSTS_QUERY_KEY } from "@/features/pages/profile/hooks/useProfilePosts";
import { ClientSession } from "@/utils/session";

export const DELETE_POST_MUTATION_KEY = ["post", "delete"] as const;

type DeletePostVariables = {
  postId: string;
};

export function useDeletePost() {
  const queryClient = useQueryClient();
  const { data: session } = ClientSession();
  const username = session?.user?.username || "";
  const profilePostsKey = PROFILE_POSTS_QUERY_KEY(username);
  return useMutation<void, Error, DeletePostVariables>({
    mutationKey: DELETE_POST_MUTATION_KEY,
    mutationFn: ({ postId }) => {
      return deletePostApi(postId);
    },
    onMutate: () => {
      toast.dismiss();
      toast.loading("Deleting post...");
    },
    onSuccess: async (_, variables) => {
      toast.dismiss();
      toast.success(postMessages.delete.success);

      // Invalidate related queries
      await queryClient.invalidateQueries({
        queryKey: HOME_FEED_QUERY_KEY,
      });

      // Remove specific post from cache
      queryClient.removeQueries({
        queryKey: postDetailsQueryKey(variables.postId),
      });
      await queryClient.invalidateQueries({
        queryKey: profilePostsKey,
      });
    },
    onError: (error) => {
      toast.dismiss();
      toast.error(error.message ?? postMessages.delete.failed);
    },
  });
}
