"use client";

import {
  notifyManager,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import toast from "react-hot-toast";

import friendMessages from "@/lib/messages/addFriend";
import {
  acceptFriendRequestApi,
  type AcceptFriendRequestApiResponse,
} from "../services/addFriendApi";
import { notificationsQueryKey } from "../../notifications/hooks/useNotifications";
import { profileQueryKey } from "@/features/pages/profile/hooks/useProfile";

export type UseAcceptFriendRequestArgs = {
  profileUsername: string;
};

export const acceptFriendRequestMutationKey = (profileUsername: string) =>
  ["friend-request", "accept", profileUsername] as const;

export function useAcceptFriendRequest({
  profileUsername,
}: UseAcceptFriendRequestArgs) {
  const queryClient = useQueryClient();

  return useMutation<AcceptFriendRequestApiResponse, Error, void>({
    mutationKey: acceptFriendRequestMutationKey(profileUsername),
    mutationFn: () => acceptFriendRequestApi({ username: profileUsername }),
    onMutate: async () => {
      toast.dismiss();
      toast.loading(friendMessages.FEEDBACK.loadingAcceptRequest);
    },
    onSuccess: async ({ message }) => {
      toast.dismiss();
      toast.success(message ?? friendMessages.FEEDBACK.acceptRequestSuccess);
      notifyManager.batch(() => {
        queryClient.invalidateQueries({
          queryKey: profileQueryKey(profileUsername),
        });
        queryClient.invalidateQueries({
          queryKey: notificationsQueryKey(false),
        });
        queryClient.invalidateQueries({
          queryKey: notificationsQueryKey(true),
        });

        queryClient.invalidateQueries({ queryKey: ["relations"] });
      });
    },
    onError: (error) => {
      toast.dismiss();
      toast.error(
        error.message ?? friendMessages.FEEDBACK.acceptRequestFailure
      );
    },
  });
}
