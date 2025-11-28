"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

import { profileQueryKey } from "@/features/pages/profile/hooks/useProfile";
import { relationsQueryKey } from "@/features/pages/relations/hooks/useRelationsInfiniteList";
import { followMessages } from "@/lib/messages";
import type { FollowActionInput, FollowApiResponse } from "../types";
import { unfollowUserApi } from "../services/followApi";

export const UNFOLLOW_MUTATION_KEY = ["follow", "unfollow-user"] as const;

export function useUnfollow() {
  const queryClient = useQueryClient();

  return useMutation<FollowApiResponse, Error, FollowActionInput>({
    mutationKey: UNFOLLOW_MUTATION_KEY,
    mutationFn: unfollowUserApi,
    onMutate: async () => {
      toast.dismiss();
      toast.loading(followMessages.FEEDBACK.loadingUnfollow);
    },
    onSuccess: async ({ message }, variables) => {
      toast.dismiss();
      toast.success(message || followMessages.FEEDBACK.unfollowSuccess);

      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: profileQueryKey(variables.username),
        }),
        queryClient.invalidateQueries({
          queryKey: relationsQueryKey("following"),
        }),
      ]);
    },
    onError: (err) => {
      toast.dismiss();
      toast.error(err.message || followMessages.FEEDBACK.unfollowFailure);
    },
  });
}
