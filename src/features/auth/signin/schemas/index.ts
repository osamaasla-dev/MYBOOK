import { authMessages } from "@/lib/messages";
import { z } from "zod";

export const signInSchema = z.object({
  email: z.string().email({ message: authMessages.signup.invalidEmail }),
  password: z.string().min(6, { message: authMessages.signup.invalidPassword }),
});

export type SignInValues = z.infer<typeof signInSchema>;
