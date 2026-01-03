"use client";

import {
  notifyManager,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import toast from "react-hot-toast";

import friendMessages from "@/lib/messages/addFriend";
import {
  rejectFriendRequestApi,
  type RejectFriendRequestApiResponse,
} from "../services/client";
import { profileQueryKey } from "@/features/pages/profile/hooks/useProfile";
import type { ProfileRouteData } from "@/features/pages/profile/types";
import { invalidateNotificationTabQueries } from "../../notifications/hooks/notificationQueryUtils";
import { relationsQueryKey } from "@/features/pages/relations/hooks/useRelationsInfiniteList";

export type UseRejectFriendRequestArgs = {
  profileUsername: string;
};

export const rejectFriendRequestMutationKey = (profileUsername: string) =>
  ["friend-request", "reject", profileUsername] as const;

export function useRejectFriendRequest({
  profileUsername,
}: UseRejectFriendRequestArgs) {
  const queryClient = useQueryClient();
  const queryKey = profileQueryKey(profileUsername);

  return useMutation<RejectFriendRequestApiResponse, Error, void>({
    mutationKey: rejectFriendRequestMutationKey(profileUsername),
    mutationFn: () => rejectFriendRequestApi({ username: profileUsername }),
    onMutate: async () => {
      toast.dismiss();
      toast.loading(friendMessages.FEEDBACK.loadingRejectRequest);
    },
    onSuccess: async ({ message }) => {
      queryClient.setQueryData<ProfileRouteData>(queryKey, (previous) => {
        if (!previous) {
          return previous;
        }

        return {
          ...previous,
          viewer: {
            ...previous.viewer,
            isFriend: false,
            hasIncomingFriendRequest: false,
            hasOutgoingFriendRequest: false,
          },
        };
      });

      toast.dismiss();
      toast.success(message ?? friendMessages.FEEDBACK.rejectRequestSuccess);

      notifyManager.batch(() => {
        invalidateNotificationTabQueries(queryClient);
        queryClient.invalidateQueries({
          queryKey: relationsQueryKey("friend-requests"),
        });
      });
    },
    onError: (error) => {
      toast.dismiss();
      toast.error(
        error.message ?? friendMessages.FEEDBACK.rejectRequestFailure
      );
    },
  });
}
