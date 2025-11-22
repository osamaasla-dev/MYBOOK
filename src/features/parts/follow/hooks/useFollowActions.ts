"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

import { followMessages } from "@/lib/messages";
import type { FollowActionInput, FollowApiResponse } from "../types";
import { followUser, unfollowUser } from "../services/followApi";
import { profileQueryKey } from "@/features/pages/profile/hooks/useProfile";
import type { ProfileRouteData } from "@/features/pages/profile/types";

type MutationFactoryArgs = {
  action: "follow" | "unfollow";
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
} as const;

function useFollowMutation({ action, mutationFn }: MutationFactoryArgs) {
  const queryClient = useQueryClient();
  const feedback = feedbackByAction[action];

  return useMutation<
    FollowApiResponse,
    Error,
    FollowActionInput,
    { previousProfile?: ProfileRouteData }
  >({
    mutationFn,
    onMutate: async (variables) => {
      toast.dismiss();
      toast.loading(feedback.loading);

      const queryKey = profileQueryKey(variables.username);
      await queryClient.cancelQueries({ queryKey });

      const previousProfile =
        queryClient.getQueryData<ProfileRouteData>(queryKey);
      if (previousProfile) {
        const followerDelta = action === "follow" ? 1 : -1;

        const nextProfile: ProfileRouteData = {
          ...previousProfile,
          profile: {
            ...previousProfile.profile,
            followersCount: Math.max(
              0,
              previousProfile.profile.followersCount + followerDelta
            ),
          },
          viewer: {
            ...previousProfile.viewer,
            isFollowing: action === "follow",
          },
        };

        queryClient.setQueryData(queryKey, nextProfile);
      }

      return { previousProfile };
    },
    onSuccess: ({ message }) => {
      toast.dismiss();
      toast.success(message || feedback.success);
    },
    onError: (err, variables, context) => {
      if (context?.previousProfile) {
        queryClient.setQueryData(
          profileQueryKey(variables.username),
          context.previousProfile
        );
      }

      toast.dismiss();
      toast.error(err.message || feedback.failure);
    },
  });
}

export function useFollowUserMutation() {
  return useFollowMutation({ action: "follow", mutationFn: followUser });
}

export function useUnfollowUserMutation() {
  return useFollowMutation({
    action: "unfollow",
    mutationFn: unfollowUser,
  });
}
