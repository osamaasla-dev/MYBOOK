import {
  SignUpManager,
  getSignUpPageMetadata,
} from "@/features/Auth/SignUp/page";
import { getCachedSiteName } from "@/lib/settings";

export default async function SignupPage() {
  const siteName = await getCachedSiteName();
  return <SignUpManager siteName={siteName} />;
}

export async function generateMetadata() {
  return getSignUpPageMetadata();
}
