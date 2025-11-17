import { apiPostR } from "@/lib/api";
import type { ForgotPasswordValues } from "../schemas";

export const requestPasswordReset = async (
  values: ForgotPasswordValues
): Promise<{ message: string }> => {
  const res = await apiPostR<unknown>("/auth/forgot-password", values);
  return { message: res.message };
};
