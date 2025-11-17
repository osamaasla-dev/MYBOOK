"use client";

import { useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { resetPassword } from "../services";
import type { ResetPasswordValues } from "../schemas";

export function useResetPassword() {
  return useMutation<{ message: string }, Error, { token: string } & ResetPasswordValues>({
    mutationFn: ({ token, password, confirmPassword }) =>
      resetPassword({ token, password, confirmPassword }),
    onMutate: () => {
      toast.dismiss();
      toast.loading("Resetting password...");
    },
    onSuccess: ({ message }) => {
      toast.dismiss();
      toast.success(message || "Password reset successfully");
    },
    onError: (err) => {
      toast.dismiss();
      toast.error(err.message || "Failed to reset password");
    },
  });
}
