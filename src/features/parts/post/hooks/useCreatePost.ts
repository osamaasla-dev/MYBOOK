"use client";

import { useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";

import type { CreatePostInput } from "../schemas";
import { submitCreatePost } from "../services";
import { postMessages } from "@/lib/messages";
import type { CreatePostResponseData } from "../types";

export const CREATE_POST_MUTATION_KEY = ["posts", "create"] as const;

type CreatePostPayload = {
  input: CreatePostInput;
};

export function useCreatePost() {
  return useMutation<CreatePostResponseData, Error, CreatePostPayload>({
    mutationKey: CREATE_POST_MUTATION_KEY,
    mutationFn: ({ input }) => submitCreatePost(input),
    onMutate: () => {
      toast.dismiss();
      toast.loading(postMessages.created);
    },
    onSuccess: async () => {
      toast.dismiss();
      toast.success(postMessages.created);
    },
    onError: (error) => {
      toast.dismiss();
      toast.error(error.message ?? postMessages.unexpectedError);
    },
  });
}
