import { ForgotPasswordManager, getForgotPasswordPageMetadata } from "@/features/auth/forgotPassword/page";

export default function ForgotPasswordPage() {
  return <ForgotPasswordManager />;
}

export async function generateMetadata() {
  return getForgotPasswordPageMetadata();
}
