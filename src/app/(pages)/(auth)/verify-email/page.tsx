import { VerifyEmailManager, getVerifyEmailPageMetadata } from "@/features/auth/verify-Email/page";

export default function VerifyEmailPage() {
  return <VerifyEmailManager />;
}

export async function generateMetadata() {
  return getVerifyEmailPageMetadata();
}
