import {
  ForgotPasswordManager,
  getForgotPasswordPageMetadata,
} from "@/features/Auth/ForgotPassword/page";

export default function ForgotPasswordPage() {
  return <ForgotPasswordManager />;
}

export async function generateMetadata() {
  return getForgotPasswordPageMetadata();
}
