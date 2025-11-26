"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

import friendMessages from "@/lib/messages/addFriend";
import {
  acceptFriendRequestApi,
  type AcceptFriendRequestApiResponse,
} from "../services/addFriendApi";
import { profileQueryKey } from "@/features/pages/profile/hooks/useProfile";
import type { ProfileRouteData } from "@/features/pages/profile/types";

export type UseAcceptFriendRequestArgs = {
  profileUsername: string;
};

export function useAcceptFriendRequest({
  profileUsername,
}: UseAcceptFriendRequestArgs) {
  const queryClient = useQueryClient();
  const queryKey = profileQueryKey(profileUsername);

  return useMutation<
    AcceptFriendRequestApiResponse,
    Error,
    void,
    { previousProfile?: ProfileRouteData }
  >({
    mutationFn: () => acceptFriendRequestApi({ username: profileUsername }),
    onMutate: async () => {
      toast.dismiss();
      toast.loading(friendMessages.FEEDBACK.loadingAcceptRequest);

      await queryClient.cancelQueries({ queryKey });
      const previousProfile =
        queryClient.getQueryData<ProfileRouteData>(queryKey);

      if (previousProfile) {
        const becameFriend = !previousProfile.viewer.isFriend;

        queryClient.setQueryData<ProfileRouteData>(queryKey, {
          ...previousProfile,
          profile: {
            ...previousProfile.profile,
            friendsCount: becameFriend
              ? previousProfile.profile.friendsCount + 1
              : previousProfile.profile.friendsCount,
          },
          viewer: {
            ...previousProfile.viewer,
            isFriend: true,
            hasIncomingFriendRequest: false,
            hasOutgoingFriendRequest: false,
          },
        });
      }

      return { previousProfile };
    },
    onSuccess: ({ message }) => {
      toast.dismiss();
      toast.success(message ?? friendMessages.FEEDBACK.acceptRequestSuccess);
    },
    onError: (error, _vars, context) => {
      toast.dismiss();
      toast.error(
        error.message ?? friendMessages.FEEDBACK.acceptRequestFailure
      );

      if (context?.previousProfile) {
        queryClient.setQueryData(queryKey, context.previousProfile);
      }
    },
  });
}
