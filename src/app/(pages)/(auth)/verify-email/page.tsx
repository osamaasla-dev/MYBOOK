import {
  VerifyEmailManager,
  getVerifyEmailPageMetadata,
} from "@/features/Auth/VerifyEmail/page";

export default function VerifyEmailPage() {
  return <VerifyEmailManager />;
}

export async function generateMetadata() {
  return getVerifyEmailPageMetadata();
}
