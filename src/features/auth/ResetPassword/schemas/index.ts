import { z } from "zod";
import { authMessages } from "@/lib/messages";

export const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, authMessages.signup.invalidPassword)
      .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*[^A-Za-z0-9]).{8,}$/),
    confirmPassword: z.string(),
  })
  .superRefine(({ password, confirmPassword }, ctx) => {
    if (password !== confirmPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: authMessages.signup.passwordsMismatch,
        path: ["confirmPassword"],
      });
    }
  });

export type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;
