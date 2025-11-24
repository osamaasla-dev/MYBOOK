"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

import { followMessages } from "@/lib/messages";
import type { FollowActionInput, FollowApiResponse } from "../types";
import {
  acceptFollowRequestApi,
  rejectFollowRequestApi,
} from "../services/followApi";
import { relationsQueryKey } from "@/features/pages/relations/hooks/useRelationsInfiniteList";
import { notificationsQueryKey } from "@/features/parts/notifications/hooks/useNotifications";
import type { RelationTab } from "@/features/pages/relations/types";

const feedbackByAction = {
  "accept-request": {
    loading: followMessages.FEEDBACK.loadingFollow,
    success: followMessages.FEEDBACK.acceptRequestSuccess,
    failure: followMessages.FEEDBACK.acceptRequestFailure,
  },
  "reject-request": {
    loading: followMessages.FEEDBACK.loadingCancelRequest,
    success: followMessages.FEEDBACK.rejectRequestSuccess,
    failure: followMessages.FEEDBACK.rejectRequestFailure,
  },
} as const;

const cacheInvalidations: Record<keyof typeof feedbackByAction, RelationTab[]> =
  {
    "accept-request": ["follow-requests", "followers"],
    "reject-request": ["follow-requests"],
  };

function useFollowRequestMutation(
  action: keyof typeof feedbackByAction,
  mutationFn: (input: FollowActionInput) => Promise<FollowApiResponse>
) {
  const queryClient = useQueryClient();
  const feedback = feedbackByAction[action];
  const tabsToInvalidate = cacheInvalidations[action];

  return useMutation<FollowApiResponse, Error, FollowActionInput>({
    mutationFn,
    onMutate: () => {
      toast.dismiss();
      toast.loading(feedback.loading);
    },
    onSuccess: async ({ message }) => {
      toast.dismiss();
      toast.success(message || feedback.success);

      await Promise.all([
        ...tabsToInvalidate.map((tab) =>
          queryClient.invalidateQueries({ queryKey: relationsQueryKey(tab) })
        ),
        queryClient.invalidateQueries({
          queryKey: notificationsQueryKey(false),
        }),
        queryClient.invalidateQueries({
          queryKey: notificationsQueryKey(true),
        }),
      ]);
    },
    onError: (err) => {
      toast.dismiss();
      toast.error(err.message || feedback.failure);
    },
  });
}

export function useAcceptFollowRequestMutation() {
  return useFollowRequestMutation("accept-request", acceptFollowRequestApi);
}

export function useRejectFollowRequestMutation() {
  return useFollowRequestMutation("reject-request", rejectFollowRequestApi);
}
