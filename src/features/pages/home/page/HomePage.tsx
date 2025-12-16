"use client";

import { HomePostsSection } from "@/features/pages/home/components/posts/HomePostsSection";
import { PostDetailsModalLayer } from "@/features/parts/post/components/PostDetailsModal/PostDetailsModalLayer";
import { PageContainer } from "../components/PageContainer";

export function HomePage() {
  return (
    <>
      <PostDetailsModalLayer />

      <PageContainer>
        <div className="col-span-1"></div>
        <HomePostsSection />
        <div className="col-span-1"></div>
      </PageContainer>
    </>
  );
}
