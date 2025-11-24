"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

import { followMessages } from "@/lib/messages";
import type { FollowActionInput, FollowApiResponse } from "../types";
import {
  followUserApi,
  unfollowUserApi,
  cancelFollowRequestApi,
} from "../services/followApi";
import { profileQueryKey } from "@/features/pages/profile/hooks/useProfile";

type MutationFactoryArgs = {
  action: "follow" | "unfollow" | "cancel-request";
  mutationFn: (input: FollowActionInput) => Promise<FollowApiResponse>;
};

const feedbackByAction = {
  follow: {
    loading: followMessages.FEEDBACK.loadingFollow,
    success: followMessages.FEEDBACK.followSuccess,
    failure: followMessages.FEEDBACK.followFailure,
  },
  unfollow: {
    loading: followMessages.FEEDBACK.loadingUnfollow,
    success: followMessages.FEEDBACK.unfollowSuccess,
    failure: followMessages.FEEDBACK.unfollowFailure,
  },
  "cancel-request": {
    loading: followMessages.FEEDBACK.loadingCancelRequest,
    success: followMessages.FEEDBACK.cancelRequestSuccess,
    failure: followMessages.FEEDBACK.cancelRequestFailure,
  },
} as const;

function useFollowMutation({ action, mutationFn }: MutationFactoryArgs) {
  const queryClient = useQueryClient();
  const feedback = feedbackByAction[action];

  return useMutation<FollowApiResponse, Error, FollowActionInput>({
    mutationFn,
    onMutate: () => {
      toast.dismiss();
      toast.loading(feedback.loading);
    },
    onSuccess: ({ message }, variables) => {
      toast.dismiss();
      toast.success(message || feedback.success);

      queryClient.invalidateQueries({
        queryKey: profileQueryKey(variables.username),
      });
    },
    onError: (err) => {
      toast.dismiss();
      toast.error(err.message || feedback.failure);
    },
  });
}

export function useFollowUserMutation() {
  return useFollowMutation({ action: "follow", mutationFn: followUserApi });
}

export function useUnfollowUserMutation() {
  return useFollowMutation({
    action: "unfollow",
    mutationFn: unfollowUserApi,
  });
}

export function useCancelFollowRequestMutation() {
  return useFollowMutation({
    action: "cancel-request",
    mutationFn: cancelFollowRequestApi,
  });
}
