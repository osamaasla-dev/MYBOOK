"use client";

import {
  notifyManager,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import toast from "react-hot-toast";

import { followMessages } from "@/lib/messages";
import type { FollowActionInput, FollowApiResponse } from "../types";
import { acceptFollowRequestApi } from "../services/client";
import { relationsQueryKey } from "@/features/pages/relations/hooks/useRelationsInfiniteList";
import { invalidateNotificationTabQueries } from "@/features/parts/notifications/hooks";

const RELATION_TABS_TO_INVALIDATE = ["follow-requests", "followers"] as const;

export function useAcceptFollowRequest() {
  const queryClient = useQueryClient();

  return useMutation<FollowApiResponse, Error, FollowActionInput>({
    mutationKey: ["follow-request", "accept"],
    mutationFn: acceptFollowRequestApi,
    onMutate: () => {
      toast.dismiss();
      toast.loading(followMessages.FEEDBACK.loadingFollow);
    },
    onSuccess: async ({ message }) => {
      toast.dismiss();
      toast.success(message || followMessages.FEEDBACK.acceptRequestSuccess);

      notifyManager.batch(() => {
        RELATION_TABS_TO_INVALIDATE.forEach((tab) =>
          queryClient.invalidateQueries({ queryKey: relationsQueryKey(tab) })
        );
        invalidateNotificationTabQueries(queryClient);
      });
    },
    onError: (err) => {
      toast.dismiss();
      toast.error(err.message || followMessages.FEEDBACK.acceptRequestFailure);
    },
  });
}
