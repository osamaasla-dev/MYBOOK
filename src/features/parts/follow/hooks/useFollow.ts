"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

import { profileQueryKey } from "@/features/pages/profile/hooks/useProfile";
import { relationsQueryKey } from "@/features/pages/relations/hooks/useRelationsInfiniteList";
import { followMessages } from "@/lib/messages";
import type { FollowActionInput, FollowApiResponse } from "../types";
import { followUserApi } from "../services/followApi";

export const FOLLOW_MUTATION_KEY = ["follow", "follow-user"] as const;

export function useFollow() {
  const queryClient = useQueryClient();

  return useMutation<FollowApiResponse, Error, FollowActionInput>({
    mutationKey: FOLLOW_MUTATION_KEY,
    mutationFn: followUserApi,
    onMutate: async () => {
      toast.dismiss();
      toast.loading(followMessages.FEEDBACK.loadingFollow);
    },
    onSuccess: async ({ message }, variables) => {
      toast.dismiss();
      toast.success(message || followMessages.FEEDBACK.followSuccess);

      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: profileQueryKey(variables.username),
        }),
        queryClient.invalidateQueries({
          queryKey: relationsQueryKey("following"),
        }),
        queryClient.invalidateQueries({
          queryKey: relationsQueryKey("follow-requests"),
        }),
      ]);
    },
    onError: (err) => {
      toast.dismiss();
      toast.error(err.message || followMessages.FEEDBACK.followFailure);
    },
  });
}
