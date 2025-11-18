import { apiGetR } from "@/lib/api";

export async function verifyEmail(token: string): Promise<{ message: string }> {
  const { message } = await apiGetR<unknown>(
    `/auth/verify-email?token=${encodeURIComponent(token)}`
  );
  return { message };
}
