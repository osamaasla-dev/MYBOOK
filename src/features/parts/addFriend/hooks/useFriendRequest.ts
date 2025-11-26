"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

import friendMessages from "@/lib/messages/addFriend";
import {
  type FriendRequestApiResponse,
  sendFriendRequestApi,
} from "../services/addFriendApi";
import { profileQueryKey } from "@/features/pages/profile/hooks/useProfile";
import type { ProfileRouteData } from "@/features/pages/profile/types";

export type UseSendFriendRequestArgs = {
  profileUsername: string;
};

export function useSendFriendRequest({
  profileUsername,
}: UseSendFriendRequestArgs) {
  const queryClient = useQueryClient();
  const queryKey = profileQueryKey(profileUsername);

  return useMutation<
    FriendRequestApiResponse,
    Error,
    void,
    { previousProfile?: ProfileRouteData }
  >({
    mutationFn: () => sendFriendRequestApi({ username: profileUsername }),
    onMutate: async () => {
      toast.dismiss();
      toast.loading(friendMessages.FEEDBACK.loadingRequest);

      await queryClient.cancelQueries({ queryKey });
      const previousProfile =
        queryClient.getQueryData<ProfileRouteData>(queryKey);

      if (previousProfile) {
        queryClient.setQueryData<ProfileRouteData>(queryKey, {
          ...previousProfile,
          viewer: {
            ...previousProfile.viewer,
            hasOutgoingFriendRequest: true,
            hasIncomingFriendRequest: false,
          },
        });
      }

      return { previousProfile };
    },
    onSuccess: ({ message }) => {
      toast.dismiss();
      toast.success(message ?? friendMessages.FEEDBACK.requestSuccess);
    },
    onError: (error: Error, _vars, context) => {
      toast.dismiss();
      toast.error(error.message ?? friendMessages.FEEDBACK.requestFailure);

      if (context?.previousProfile) {
        queryClient.setQueryData(queryKey, context.previousProfile);
      }
    },
  });
}
