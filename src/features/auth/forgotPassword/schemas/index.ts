import { z } from "zod";
import { authMessages } from "@/lib/messages";

export const forgotPasswordSchema = z.object({
  email: z.string().email({ message: authMessages.signup.invalidEmail }),
});

export type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;
