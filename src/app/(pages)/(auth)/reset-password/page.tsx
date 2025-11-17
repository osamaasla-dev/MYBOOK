import { ResetPasswordManager, getResetPasswordPageMetadata } from "@/features/auth/reset-Password/page";

export default function ResetPasswordPage() {
  return <ResetPasswordManager />;
}

export async function generateMetadata() {
  return getResetPasswordPageMetadata();
}
