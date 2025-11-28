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
import { relationsQueryKey } from "@/features/pages/relations/hooks/useRelationsInfiniteList";

export type UseFriendRequestArgs = {
  profileUsername: string;
};

export const sendFriendRequestMutationKey = (profileUsername: string) =>
  ["friend-request", "send", profileUsername] as const;

export function useFriendRequest({ profileUsername }: UseFriendRequestArgs) {
  const queryClient = useQueryClient();
  const queryKey = profileQueryKey(profileUsername);

  return useMutation<FriendRequestApiResponse, Error, void>({
    mutationKey: sendFriendRequestMutationKey(profileUsername),
    mutationFn: () => sendFriendRequestApi({ username: profileUsername }),
    onMutate: async () => {
      toast.dismiss();
      toast.loading(friendMessages.FEEDBACK.loadingRequest);
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
            hasOutgoingFriendRequest: true,
            hasIncomingFriendRequest: false,
          },
        };
      });

      queryClient.invalidateQueries({
        queryKey: relationsQueryKey("sent-friend-requests"),
      });
      toast.dismiss();
      toast.success(message ?? friendMessages.FEEDBACK.requestSuccess);
    },
    onError: (error: Error) => {
      toast.dismiss();
      toast.error(error.message ?? friendMessages.FEEDBACK.requestFailure);
    },
  });
}
