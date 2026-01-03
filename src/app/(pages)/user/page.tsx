import { HomePage } from "@/features/pages/home/page/HomePage";
import { getUserHomePageMetadata } from "@/features/pages/home/page/userHomeMeta";

export const dynamic = "force-dynamic";

export default function UserDirectoryPage() {
  return <HomePage />;
}

export const generateMetadata = getUserHomePageMetadata;
