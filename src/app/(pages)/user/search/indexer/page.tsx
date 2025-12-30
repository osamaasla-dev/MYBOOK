import { Metadata } from "next";

import { UserSearchIndexerPage } from "@/features/search/users/components/UserSearchIndexerPage";

export const metadata: Metadata = {
  title: "رفع المستخدمين | MYBOOK",
  description: "تشغيل رفع المستخدمين إلى Algolia لتحديث نتائج البحث.",
};

export default function UserSearchIndexerRoute() {
  return <UserSearchIndexerPage />;
}
