"use client";

import {
  notifyManager,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import toast from "react-hot-toast";

import { followMessages } from "@/lib/messages";
import type { FollowActionInput, FollowApiResponse } from "../types";
import { rejectFollowRequestApi } from "../services/followApi";
import { relationsQueryKey } from "@/features/pages/relations/hooks/useRelationsInfiniteList";
import { invalidateNotificationTabQueries } from "@/features/parts/notifications/hooks";

const RELATION_TABS_TO_INVALIDATE = ["follow-requests"] as const;

export function useRejectFollowRequest() {
  const queryClient = useQueryClient();

  return useMutation<FollowApiResponse, Error, FollowActionInput>({
    mutationKey: ["follow-request", "reject"],
    mutationFn: rejectFollowRequestApi,
    onMutate: () => {
      toast.dismiss();
      toast.loading(followMessages.FEEDBACK.loadingCancelRequest);
    },
    onSuccess: async ({ message }) => {
      toast.dismiss();
      toast.success(message || followMessages.FEEDBACK.rejectRequestSuccess);

      notifyManager.batch(() => {
        RELATION_TABS_TO_INVALIDATE.forEach((tab) =>
          queryClient.invalidateQueries({ queryKey: relationsQueryKey(tab) })
        );
        invalidateNotificationTabQueries(queryClient);
      });
    },
    onError: (err) => {
      toast.dismiss();
      toast.error(err.message || followMessages.FEEDBACK.rejectRequestFailure);
    },
  });
}
