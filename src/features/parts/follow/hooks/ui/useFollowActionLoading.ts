import { useMutationState } from "@tanstack/react-query";
import type { FollowActionInput } from "../../types";
import {
  useFollow,
  useUnfollow,
  useCancelFollowRequest,
  useAcceptFollowRequest,
  useRejectFollowRequest,
  useRemoveFollower,
} from "../";
import {
  FOLLOW_MUTATION_KEY,
  UNFOLLOW_MUTATION_KEY,
  CANCEL_FOLLOW_REQUEST_MUTATION_KEY,
  REMOVE_FOLLOWER_MUTATION_KEY,
} from "../";

// Generic hook for tracking pending mutations
function useFollowActionPending(
  mutationKey: readonly unknown[],
  username: string
) {
  return useMutationState({
    filters: {
      mutationKey,
      status: "pending",
      predicate: (mutation) => {
        const variables = mutation.state.variables as
          | FollowActionInput
          | undefined;
        return variables?.username === username;
      },
    },
  });
}

// Hook for main follow actions (follow/unfollow/cancel)
export function useFollowActionLoading(profileUsername: string) {
  const followMutation = useFollow();
  const unfollowMutation = useUnfollow();
  const cancelRequestMutation = useCancelFollowRequest();

  const sharedFollowPending = useFollowActionPending(
    FOLLOW_MUTATION_KEY,
    profileUsername
  );
  const sharedUnfollowPending = useFollowActionPending(
    UNFOLLOW_MUTATION_KEY,
    profileUsername
  );
  const sharedCancelPending = useFollowActionPending(
    CANCEL_FOLLOW_REQUEST_MUTATION_KEY,
    profileUsername
  );

  const followIsPending =
    followMutation.isPending || sharedFollowPending.length > 0;
  const unfollowIsPending =
    unfollowMutation.isPending || sharedUnfollowPending.length > 0;
  const cancelIsPending =
    cancelRequestMutation.isPending || sharedCancelPending.length > 0;

  return {
    followMutation,
    unfollowMutation,
    cancelRequestMutation,
    followIsPending,
    unfollowIsPending,
    cancelIsPending,
  };
}

// Hook for follow request actions (accept/reject)
export function useFollowRequestLoading(username: string) {
  const acceptMutation = useAcceptFollowRequest();
  const rejectMutation = useRejectFollowRequest();

  const sharedAcceptPending = useMutationState({
    filters: {
      mutationKey: ["follow-request", "accept"],
      status: "pending",
      predicate: (mutation) => {
        const variables = mutation.state.variables as
          | FollowActionInput
          | undefined;
        return variables?.username === username;
      },
    },
  });

  const sharedRejectPending = useMutationState({
    filters: {
      mutationKey: ["follow-request", "reject"],
      status: "pending",
      predicate: (mutation) => {
        const variables = mutation.state.variables as
          | FollowActionInput
          | undefined;
        return variables?.username === username;
      },
    },
  });

  const acceptIsPending =
    acceptMutation.isPending || sharedAcceptPending.length > 0;
  const rejectIsPending =
    rejectMutation.isPending || sharedRejectPending.length > 0;

  return {
    acceptMutation,
    rejectMutation,
    acceptIsPending,
    rejectIsPending,
  };
}

// Hook for remove follower action
export function useRemoveFollowerLoading(username: string) {
  const removeFollowerMutation = useRemoveFollower();
  const sharedPending = useMutationState({
    filters: {
      mutationKey: REMOVE_FOLLOWER_MUTATION_KEY,
      status: "pending",
      predicate: (mutation) => {
        const variables = mutation.state.variables as
          | FollowActionInput
          | undefined;
        return variables?.username === username;
      },
    },
  });

  const isPending =
    removeFollowerMutation.isPending || sharedPending.length > 0;

  return {
    removeFollowerMutation,
    isPending,
  };
}
