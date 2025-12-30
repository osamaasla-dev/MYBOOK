"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

import type { CreatePostInput } from "../schemas";
import { submitCreatePost } from "../services/client";
import { postMessages } from "@/lib/messages";
import type { CreatePostResponseData } from "../types";
import { HOME_FEED_QUERY_KEY } from "@/features/pages/home/hooks/useHomeFeed";
import { ClientSession } from "@/utils/session";
import { PROFILE_POSTS_QUERY_KEY } from "@/features/pages/profile/hooks/useProfilePosts";

export const CREATE_POST_MUTATION_KEY = ["posts", "create"] as const;

type CreatePostPayload = {
  input: CreatePostInput;
};

export function useCreatePost() {
  const queryClient = useQueryClient();
  const { data } = ClientSession();
  const profilePostsKey = PROFILE_POSTS_QUERY_KEY(data?.user?.username ?? "");
  return useMutation<CreatePostResponseData, Error, CreatePostPayload>({
    mutationKey: CREATE_POST_MUTATION_KEY,
    mutationFn: ({ input }) => submitCreatePost(input),
    onMutate: () => {
      toast.dismiss();
      toast.loading(postMessages.created);
    },
    onSuccess: async () => {
      toast.dismiss();
      toast.success(postMessages.created);
      await queryClient.invalidateQueries({
        queryKey: HOME_FEED_QUERY_KEY,
      });
      await queryClient.invalidateQueries({
        queryKey: profilePostsKey,
      });
    },
    onError: (error) => {
      toast.dismiss();
      toast.error(error.message ?? postMessages.unexpectedError);
    },
  });
}
