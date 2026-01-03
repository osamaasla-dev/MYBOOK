import {
  SignInManager,
  getSignInPageMetadata,
} from "@/features/auth/signin/page";
import { getCachedSiteName } from "@/lib/settings";

export const dynamic = "force-dynamic";

export default async function SigninPage() {
  const siteName = await getCachedSiteName();
  return <SignInManager siteName={siteName} />;
}

export async function generateMetadata() {
  return getSignInPageMetadata();
}
