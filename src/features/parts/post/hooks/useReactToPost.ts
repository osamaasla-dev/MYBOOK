"use client";

import { useMutation, type UseMutationOptions } from "@tanstack/react-query";

import type { PostReactionType } from "../constants/reactions";
import { reactToPostApi } from "../services/postApi";
import type { PostReactionResponse } from "../types";

export const REACT_TO_POST_MUTATION_KEY = [
  "post",
  "reaction",
  "react",
] as const;

export type ReactToPostVariables = {
  postId: string;
  reaction: PostReactionType;
  actionId?: number;
};

export function useReactToPost(
  options?: UseMutationOptions<
    PostReactionResponse,
    Error,
    ReactToPostVariables,
    unknown
  >
) {
  return useMutation<PostReactionResponse, Error, ReactToPostVariables>({
    mutationKey: REACT_TO_POST_MUTATION_KEY,
    mutationFn: ({ postId, reaction }) => reactToPostApi(postId, reaction),
    ...options,
  });
}
