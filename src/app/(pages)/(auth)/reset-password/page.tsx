import {
  ResetPasswordManager,
  getResetPasswordPageMetadata,
} from "@/features/auth/ResetPassword/page";

export const dynamic = "force-dynamic";

export default function ResetPasswordPage() {
  return <ResetPasswordManager />;
}

export async function generateMetadata() {
  return getResetPasswordPageMetadata();
}
