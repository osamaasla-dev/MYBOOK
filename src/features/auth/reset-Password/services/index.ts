import { apiGetR, apiPostR } from "@/lib/api";

export async function validateResetToken(token: string): Promise<{ valid: boolean; message: string }> {
  const { data, message } = await apiGetR<{ valid: boolean }>(
    `/auth/reset-password/validate?token=${encodeURIComponent(token)}`
  );
  return { valid: data.valid, message };
}

export async function resetPassword(payload: {
  token: string;
  password: string;
  confirmPassword: string;
}): Promise<{ message: string }> {
  const { message } = await apiPostR<unknown>("/auth/reset-password", payload);
  return { message };
}
