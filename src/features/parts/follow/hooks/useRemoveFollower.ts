"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

import { followMessages } from "@/lib/messages";
import type { FollowActionInput, FollowApiResponse } from "../types";
import { removeFollowerApi } from "../services/followApi";
import { relationsQueryKey } from "@/features/pages/relations/hooks/useRelationsInfiniteList";

export function useRemoveFollower() {
  const queryClient = useQueryClient();

  return useMutation<FollowApiResponse, Error, FollowActionInput>({
    mutationFn: removeFollowerApi,
    onMutate: () => {
      toast.dismiss();
      toast.loading(followMessages.FEEDBACK.loadingRemoveFollower);
    },
    onSuccess: async ({ message }) => {
      toast.dismiss();
      toast.success(message ?? followMessages.FEEDBACK.removeFollowerSuccess);

      await queryClient.invalidateQueries({
        queryKey: relationsQueryKey("followers"),
      });
    },
    onError: (error) => {
      toast.dismiss();
      toast.error(
        error.message ?? followMessages.FEEDBACK.removeFollowerFailure
      );
    },
  });
}
