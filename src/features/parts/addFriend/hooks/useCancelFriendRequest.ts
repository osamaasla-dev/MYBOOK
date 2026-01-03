"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

import friendMessages from "@/lib/messages/addFriend";
import {
  cancelFriendRequestApi,
  type CancelFriendRequestApiResponse,
} from "../services/client";
import { profileQueryKey } from "@/features/pages/profile/hooks/useProfile";
import type { ProfileRouteData } from "@/features/pages/profile/types";
import { relationsQueryKey } from "@/features/pages/relations/hooks/useRelationsInfiniteList";

export type UseCancelFriendRequestArgs = {
  profileUsername: string;
};

export const cancelFriendRequestMutationKey = (profileUsername: string) =>
  ["friend-request", "cancel", profileUsername] as const;

export function useCancelFriendRequest({
  profileUsername,
}: UseCancelFriendRequestArgs) {
  const queryClient = useQueryClient();
  const queryKey = profileQueryKey(profileUsername);

  return useMutation<CancelFriendRequestApiResponse, Error, void>({
    mutationKey: cancelFriendRequestMutationKey(profileUsername),
    mutationFn: () => cancelFriendRequestApi({ username: profileUsername }),
    onMutate: async () => {
      toast.dismiss();
      toast.loading(friendMessages.FEEDBACK.loadingCancelRequest);
    },
    onSuccess: ({ message }) => {
      queryClient.setQueryData<ProfileRouteData>(queryKey, (previous) => {
        if (!previous) {
          return previous;
        }

        return {
          ...previous,
          viewer: {
            ...previous.viewer,
            hasOutgoingFriendRequest: false,
            hasIncomingFriendRequest: false,
          },
        };
      });

      queryClient.invalidateQueries({
        queryKey: relationsQueryKey("sent-friend-requests"),
      });

      toast.dismiss();
      toast.success(message ?? friendMessages.FEEDBACK.cancelRequestSuccess);
    },
    onError: () => {
      toast.dismiss();
      toast.error(friendMessages.FEEDBACK.cancelRequestFailure);
    },
  });
}
