"use client";

import { useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";
import type { ForgotPasswordValues } from "../schemas";
import { requestPasswordReset } from "../services";

export function useForgotPassword() {
  return useMutation<{ message: string }, Error, ForgotPasswordValues>({
    mutationFn: requestPasswordReset,
    onMutate: () => {
      toast.dismiss();
      toast.loading("Sending reset link...");
    },
    onSuccess: ({ message }) => {
      toast.dismiss();
      toast.success(message || "If this email exists, a reset link was sent.");
    },
    onError: (err) => {
      toast.dismiss();
      toast.error(err.message || "Failed to send reset link");
    },
  });
}
