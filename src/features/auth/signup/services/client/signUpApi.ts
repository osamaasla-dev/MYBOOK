import { apiPostR } from "@/lib/api";
import type { SignUpInput } from "../../schemas";

export const signUp = async (
  values: SignUpInput
): Promise<{ message: string }> => {
  const res = await apiPostR<unknown>("/auth/signup", values);
  return { message: res.message };
};
