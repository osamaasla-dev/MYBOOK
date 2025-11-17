"use client";

import { useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";
import type { SignUpInput } from "../schemas";
import { signUp } from "../services";

export function useSignUp() {
  return useMutation<{ message: string }, Error, SignUpInput>({
    mutationFn: signUp,
    onMutate: () => {
      toast.dismiss();
      toast.loading("Signing up...");
    },
    onSuccess: ({ message }) => {
      toast.dismiss();
      toast.success(message || "Successfully signed up");
    },
    onError: (err) => {
      toast.dismiss();
      toast.error(err.message || "Failed to sign up");
    },
  });
}
