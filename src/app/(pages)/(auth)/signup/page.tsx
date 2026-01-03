import {
  SignUpManager,
  getSignUpPageMetadata,
} from "@/features/auth/signup/page";
import { getCachedSiteName } from "@/lib/settings";

export const dynamic = "force-dynamic";

export default async function SignupPage() {
  const siteName = await getCachedSiteName();
  return <SignUpManager siteName={siteName} />;
}

export async function generateMetadata() {
  return getSignUpPageMetadata();
}
