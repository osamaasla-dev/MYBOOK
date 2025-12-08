"use client";

import { HomePostsSection } from "@/features/pages/home/components/posts/HomePostsSection";
import { PageContainer } from "../components/PageContainer";

export function HomePage() {
  return (
    <div className="flex flex-col gap-6">
      <PageContainer>
        <HomePostsSection />
      </PageContainer>
    </div>
  );
}
