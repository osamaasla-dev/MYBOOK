"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

import { followMessages } from "@/lib/messages";
import type { FollowActionInput, FollowApiResponse } from "../types";
import { acceptFollowRequestApi } from "../services/followApi";
import { relationsQueryKey } from "@/features/pages/relations/hooks/useRelationsInfiniteList";
import { notificationsQueryKey } from "@/features/parts/notifications/hooks/useNotifications";

const RELATION_TABS_TO_INVALIDATE = ["follow-requests", "followers"] as const;

export function useAcceptFollowRequest() {
  const queryClient = useQueryClient();

  return useMutation<FollowApiResponse, Error, FollowActionInput>({
    mutationFn: acceptFollowRequestApi,
    onMutate: () => {
      toast.dismiss();
      toast.loading(followMessages.FEEDBACK.loadingFollow);
    },
    onSuccess: async ({ message }) => {
      toast.dismiss();
      toast.success(message || followMessages.FEEDBACK.acceptRequestSuccess);

      await Promise.all([
        ...RELATION_TABS_TO_INVALIDATE.map((tab) =>
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
      toast.error(err.message || followMessages.FEEDBACK.acceptRequestFailure);
    },
  });
}
