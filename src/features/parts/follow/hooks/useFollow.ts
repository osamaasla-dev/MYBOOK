"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

import type { ProfileRouteData } from "@/features/pages/profile/types";
import { profileQueryKey } from "@/features/pages/profile/hooks/useProfile";
import { followMessages } from "@/lib/messages";
import type { FollowActionInput, FollowApiResponse } from "../types";
import { followUserApi } from "../services/followApi";

export function useFollow() {
  const queryClient = useQueryClient();

  return useMutation<
    FollowApiResponse,
    Error,
    FollowActionInput,
    {
      previousProfile?: ProfileRouteData;
      queryKey: ReturnType<typeof profileQueryKey>;
    }
  >({
    mutationFn: followUserApi,
    onMutate: async (variables) => {
      toast.dismiss();
      toast.loading(followMessages.FEEDBACK.loadingFollow);

      const queryKey = profileQueryKey(variables.username);
      await queryClient.cancelQueries({ queryKey });

      const previousProfile =
        queryClient.getQueryData<ProfileRouteData>(queryKey);

      queryClient.setQueryData<ProfileRouteData>(queryKey, (previous) => {
        if (!previous) {
          return previous;
        }

        return {
          ...previous,
          viewer: {
            ...previous.viewer,
            isFollowing: true,
            hasPendingFollowRequest: previous.viewer.hasPendingFollowRequest,
          },
        };
      });

      return { previousProfile, queryKey };
    },
    onSuccess: async ({ message }, variables) => {
      toast.dismiss();
      toast.success(message || followMessages.FEEDBACK.followSuccess);

      await queryClient.invalidateQueries({
        queryKey: profileQueryKey(variables.username),
      });
    },
    onError: (err, _variables, context) => {
      toast.dismiss();
      toast.error(err.message || followMessages.FEEDBACK.followFailure);

      if (context?.previousProfile) {
        queryClient.setQueryData(context.queryKey, context.previousProfile);
      }
    },
  });
}
