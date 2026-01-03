import {
  VerifyEmailManager,
  getVerifyEmailPageMetadata,
} from "@/features/auth/VerifyEmail/page";

export const dynamic = "force-dynamic";

export default function VerifyEmailPage() {
  return <VerifyEmailManager />;
}

export async function generateMetadata() {
  return getVerifyEmailPageMetadata();
}
