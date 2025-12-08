"use client";

import type { RankedPost } from "@/features/pages/home/utils/posts/post-ranking";
import { PostCard } from "@/features/parts/post/components/PostCard/PostCard";
import { buildPostCardPropsFromRankedPost } from "@/features/parts/post/components/PostCard/buildPost";

type FeedItemProps = {
  post: RankedPost;
};

export function FeedItem({ post }: FeedItemProps) {
  return <PostCard {...buildPostCardPropsFromRankedPost(post)} />;
}
