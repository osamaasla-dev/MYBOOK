"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

import type { ProfileRouteData } from "@/features/pages/profile/types";
import { profileQueryKey } from "@/features/pages/profile/hooks/useProfile";
import { relationsQueryKey } from "@/features/pages/relations/hooks/useRelationsInfiniteList";
import { followMessages } from "@/lib/messages";
import type { FollowActionInput, FollowApiResponse } from "../types";
import { cancelFollowRequestApi } from "../services/followApi";

const RELATION_TABS_TO_INVALIDATE = [
  "follow-requests",
  "sent-follow-requests",
] as const;

export function useCancelFollowRequest() {
  const queryClient = useQueryClient();

  return useMutation<
    FollowApiResponse,
    Error,
    FollowActionInput,
    {
      previousProfile?: ProfileRouteData;
      queryKey: ReturnType<typeof profileQueryKey>;
    }
  >({
    mutationFn: cancelFollowRequestApi,
    onMutate: async (variables) => {
      toast.dismiss();
      toast.loading(followMessages.FEEDBACK.loadingCancelRequest);

      const queryKey = profileQueryKey(variables.username);
      await queryClient.cancelQueries({ queryKey });

      const previousProfile =
        queryClient.getQueryData<ProfileRouteData>(queryKey);

      queryClient.setQueryData<ProfileRouteData>(queryKey, (previous) => {
        if (!previous) {
          return previous;
        }

        return {
          ...previous,
          viewer: {
            ...previous.viewer,
            hasPendingFollowRequest: false,
          },
        };
      });

      return { previousProfile, queryKey };
    },
    onSuccess: async ({ message }) => {
      toast.dismiss();
      toast.success(message || followMessages.FEEDBACK.cancelRequestSuccess);

      await Promise.all([
        ...RELATION_TABS_TO_INVALIDATE.map((tab) =>
          queryClient.invalidateQueries({ queryKey: relationsQueryKey(tab) })
        ),
      ]);
    },
    onError: (err, _variables, context) => {
      toast.dismiss();
      toast.error(err.message || followMessages.FEEDBACK.cancelRequestFailure);

      if (context?.previousProfile) {
        queryClient.setQueryData(context.queryKey, context.previousProfile);
      }
    },
  });
}
