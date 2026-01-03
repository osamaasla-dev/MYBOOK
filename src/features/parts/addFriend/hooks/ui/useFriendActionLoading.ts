import { useMutationState } from "@tanstack/react-query";
import {
  cancelFriendRequestMutationKey,
  sendFriendRequestMutationKey,
  unFriendMutationKey,
} from "..";
import { useFriendRequest } from "../useFriendRequest";
import { useCancelFriendRequest } from "../useCancelFriendRequest";
import { useUnFriend } from "../useUnFriend";

export function useFriendActionLoading(profileUsername: string) {
  const sendFriendRequest = useFriendRequest({ profileUsername });
  const cancelFriendRequest = useCancelFriendRequest({ profileUsername });
  const unFriend = useUnFriend({ profileUsername });

  const sharedSendPending = useMutationState({
    filters: {
      mutationKey: sendFriendRequestMutationKey(profileUsername),
      status: "pending",
    },
  });
  const sharedCancelPending = useMutationState({
    filters: {
      mutationKey: cancelFriendRequestMutationKey(profileUsername),
      status: "pending",
    },
  });
  const sharedUnfriendPending = useMutationState({
    filters: {
      mutationKey: unFriendMutationKey(profileUsername),
      status: "pending",
    },
  });

  const sendIsPending =
    sendFriendRequest.isPending || sharedSendPending.length > 0;
  const cancelIsPending =
    cancelFriendRequest.isPending || sharedCancelPending.length > 0;
  const unFriendIsPending =
    unFriend.isPending || sharedUnfriendPending.length > 0;

  return {
    sendIsPending,
    cancelIsPending,
    unFriendIsPending,
    sendFriendRequest,
    cancelFriendRequest,
    unFriend,
  };
}
