"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

import friendMessages from "@/lib/messages/addFriend";
import {
  rejectFriendRequestApi,
  type RejectFriendRequestApiResponse,
} from "../services/addFriendApi";
import { profileQueryKey } from "@/features/pages/profile/hooks/useProfile";
import type { ProfileRouteData } from "@/features/pages/profile/types";

export type UseRejectFriendRequestArgs = {
  profileUsername: string;
};

export function useRejectFriendRequest({
  profileUsername,
}: UseRejectFriendRequestArgs) {
  const queryClient = useQueryClient();
  const queryKey = profileQueryKey(profileUsername);

  return useMutation<
    RejectFriendRequestApiResponse,
    Error,
    void,
    { previousProfile?: ProfileRouteData }
  >({
    mutationFn: () => rejectFriendRequestApi({ username: profileUsername }),
    onMutate: async () => {
      toast.dismiss();
      toast.loading(friendMessages.FEEDBACK.loadingRejectRequest);

      await queryClient.cancelQueries({ queryKey });
      const previousProfile =
        queryClient.getQueryData<ProfileRouteData>(queryKey);

      if (previousProfile) {
        queryClient.setQueryData<ProfileRouteData>(queryKey, {
          ...previousProfile,
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
      toast.success(message ?? friendMessages.FEEDBACK.rejectRequestSuccess);
    },
    onError: (error, _vars, context) => {
      toast.dismiss();
      toast.error(
        error.message ?? friendMessages.FEEDBACK.rejectRequestFailure
      );

      if (context?.previousProfile) {
        queryClient.setQueryData(queryKey, context.previousProfile);
      }
    },
  });
}
