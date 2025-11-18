import {
  ResetPasswordManager,
  getResetPasswordPageMetadata,
} from "@/features/Auth/ResetPassword/page";

export default function ResetPasswordPage() {
  return <ResetPasswordManager />;
}

export async function generateMetadata() {
  return getResetPasswordPageMetadata();
}
