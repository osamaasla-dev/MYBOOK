"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

import friendMessages from "@/lib/messages/addFriend";
import {
  cancelFriendRequestApi,
  type CancelFriendRequestApiResponse,
} from "../services/addFriendApi";
import { profileQueryKey } from "@/features/pages/profile/hooks/useProfile";
import type { ProfileRouteData } from "@/features/pages/profile/types";

export type UseCancelFriendRequestArgs = {
  profileUsername: string;
};

export function useCancelFriendRequest({
  profileUsername,
}: UseCancelFriendRequestArgs) {
  const queryClient = useQueryClient();
  const queryKey = profileQueryKey(profileUsername);

  return useMutation<
    CancelFriendRequestApiResponse,
    Error,
    void,
    { previousProfile?: ProfileRouteData }
  >({
    mutationFn: () => cancelFriendRequestApi({ username: profileUsername }),
    onMutate: async () => {
      toast.dismiss();
      toast.loading(friendMessages.FEEDBACK.loadingCancelRequest);

      await queryClient.cancelQueries({ queryKey });
      const previousProfile =
        queryClient.getQueryData<ProfileRouteData>(queryKey);

      if (previousProfile) {
        queryClient.setQueryData<ProfileRouteData>(queryKey, {
          ...previousProfile,
          viewer: {
            ...previousProfile.viewer,
            hasOutgoingFriendRequest: false,
            hasIncomingFriendRequest: false,
          },
        });
      }

      return { previousProfile };
    },
    onSuccess: ({ message }) => {
      toast.dismiss();
      toast.success(message ?? friendMessages.FEEDBACK.cancelRequestSuccess);
    },
    onError: (_error, _vars, context) => {
      toast.dismiss();
      toast.error(friendMessages.FEEDBACK.cancelRequestFailure);

      if (context?.previousProfile) {
        queryClient.setQueryData(queryKey, context.previousProfile);
      }
    },
  });
}
