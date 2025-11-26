"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

import friendMessages from "@/lib/messages/addFriend";
import {
  removeFriendApi,
  type RemoveFriendApiResponse,
} from "../services/addFriendApi";
import { profileQueryKey } from "@/features/pages/profile/hooks/useProfile";
import type { ProfileRouteData } from "@/features/pages/profile/types";

export type UseRemoveFriendArgs = {
  profileUsername: string;
};

export function useRemoveFriend({ profileUsername }: UseRemoveFriendArgs) {
  const queryClient = useQueryClient();
  const queryKey = profileQueryKey(profileUsername);

  return useMutation<
    RemoveFriendApiResponse,
    Error,
    void,
    { previousProfile?: ProfileRouteData }
  >({
    mutationFn: () => removeFriendApi({ username: profileUsername }),
    onMutate: async () => {
      toast.dismiss();
      toast.loading(friendMessages.FEEDBACK.loadingRemoveFriend);

      await queryClient.cancelQueries({ queryKey });
      const previousProfile =
        queryClient.getQueryData<ProfileRouteData>(queryKey);

      if (previousProfile) {
        const wasFriend = previousProfile.viewer.isFriend;

        queryClient.setQueryData<ProfileRouteData>(queryKey, {
          ...previousProfile,
          profile: wasFriend
            ? {
                ...previousProfile.profile,
                friendsCount: Math.max(
                  previousProfile.profile.friendsCount - 1,
                  0
                ),
              }
            : previousProfile.profile,
          viewer: {
            ...previousProfile.viewer,
            isFriend: false,
            hasIncomingFriendRequest: false,
            hasOutgoingFriendRequest: false,
          },
        });
      }

      return { previousProfile };
    },
    onSuccess: ({ message }) => {
      toast.dismiss();
      toast.success(message ?? friendMessages.FEEDBACK.removeFriendSuccess);
    },
    onError: (error, _vars, context) => {
      toast.dismiss();
      toast.error(error.message ?? friendMessages.FEEDBACK.removeFriendFailure);

      if (context?.previousProfile) {
        queryClient.setQueryData(queryKey, context.previousProfile);
      }
    },
  });
}
