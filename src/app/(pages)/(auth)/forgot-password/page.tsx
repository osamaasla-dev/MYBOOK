import {
  ForgotPasswordManager,
  getForgotPasswordPageMetadata,
} from "@/features/auth/forgotPassword/page";

export const dynamic = "force-dynamic";

export default function ForgotPasswordPage() {
  return <ForgotPasswordManager />;
}

export async function generateMetadata() {
  return getForgotPasswordPageMetadata();
}
