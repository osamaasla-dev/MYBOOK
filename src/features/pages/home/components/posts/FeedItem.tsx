"use client";

import type { FeedPost } from "@/features/pages/home/utils/posts/feed-response";
import { PostCard } from "@/features/parts/post/components/PostCard";
// import { buildPostCardPropsFromFeedPost } from "@/features/parts/post/components/PostCard/buildPost";

type FeedItemProps = {
  post: FeedPost;
};

export function FeedItem({ post }: FeedItemProps) {
  return <PostCard post={post} />;
}
