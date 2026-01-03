"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

import { blockMessages } from "@/lib/messages";
import {
  blockUserApi,
  type BlockUserActionInput,
  type BlockUserApiResponse,
} from "../services/client";
import { invalidateBlockRelatedQueries } from "./utils/invalidateBlockQueries";

export const BLOCK_MUTATION_KEY = ["block", "block-user"] as const;

export function useBlockUser() {
  const queryClient = useQueryClient();

  return useMutation<BlockUserApiResponse, Error, BlockUserActionInput>({
    mutationKey: BLOCK_MUTATION_KEY,
    mutationFn: blockUserApi,
    onMutate: async () => {
      toast.dismiss();
      toast.loading(blockMessages.FEEDBACK.loading);
    },
    onSuccess: async (_data, variables) => {
      toast.dismiss();
      toast.success(blockMessages.FEEDBACK.success);

      await invalidateBlockRelatedQueries(queryClient, variables.username);
    },
    onError: (error) => {
      toast.dismiss();
      toast.error(error.message || blockMessages.FEEDBACK.failure);
    },
  });
}
