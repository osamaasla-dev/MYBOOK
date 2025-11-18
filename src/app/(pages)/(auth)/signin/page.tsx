import {
  SignInManager,
  getSignInPageMetadata,
} from "@/features/Auth/SignIn/page";
import { getCachedSiteName } from "@/lib/settings";

export default async function SigninPage() {
  const siteName = await getCachedSiteName();
  return <SignInManager siteName={siteName} />;
}

export async function generateMetadata() {
  return getSignInPageMetadata();
}
