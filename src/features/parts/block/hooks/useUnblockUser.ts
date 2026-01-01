"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

import { blockMessages } from "@/lib/messages";
import {
  type BlockUserActionInput,
  type UnblockUserApiResponse,
  unblockUserApi,
} from "../services/blockApi";
import { invalidateBlockRelatedQueries } from "./utils/invalidateBlockQueries";

export const UNBLOCK_MUTATION_KEY = ["block", "unblock-user"] as const;

export function useUnblockUser() {
  const queryClient = useQueryClient();

  return useMutation<UnblockUserApiResponse, Error, BlockUserActionInput>({
    mutationKey: UNBLOCK_MUTATION_KEY,
    mutationFn: unblockUserApi,
    onMutate: async () => {
      toast.dismiss();
      toast.loading(blockMessages.FEEDBACK.unblocking);
    },
    onSuccess: async (_data, variables) => {
      toast.dismiss();
      toast.success(blockMessages.FEEDBACK.unblocked);

      await invalidateBlockRelatedQueries(queryClient, variables.username);
    },
    onError: (error) => {
      toast.dismiss();
      toast.error(error.message || blockMessages.FEEDBACK.unblockFailure);
    },
  });
}
