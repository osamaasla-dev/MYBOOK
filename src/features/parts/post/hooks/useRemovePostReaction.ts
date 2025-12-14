"use client";

import { useMutation, type UseMutationOptions } from "@tanstack/react-query";

import { removePostReactionApi } from "../services/client";
import type { PostReactionResponse } from "../types";

export const REMOVE_POST_REACTION_MUTATION_KEY = [
  "post",
  "reaction",
  "remove",
] as const;

export type RemovePostReactionVariables = {
  postId: string;
  actionId?: number;
};

export function useRemovePostReaction(
  options?: UseMutationOptions<
    PostReactionResponse,
    Error,
    RemovePostReactionVariables,
    unknown
  >
) {
  return useMutation<PostReactionResponse, Error, RemovePostReactionVariables>({
    mutationKey: REMOVE_POST_REACTION_MUTATION_KEY,
    mutationFn: ({ postId }) => removePostReactionApi(postId),
    ...options,
  });
}
