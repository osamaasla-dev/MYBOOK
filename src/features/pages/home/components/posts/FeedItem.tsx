"use client";

import type { FeedPost } from "@/features/pages/home/utils/posts/feed-response";
import { PostCard } from "@/features/parts/post/components/PostCard";
// import { buildPostCardPropsFromFeedPost } from "@/features/parts/post/components/PostCard/buildPost";

type FeedItemProps = {
  post: FeedPost;
};

export function FeedItem({ post }: FeedItemProps) {
  return (
    <article
      data-testid={`feed-item-${post.postId}`}
      role="article"
      aria-labelledby={`feed-item-title-${post.postId}`}
    >
      <PostCard post={post} />
    </article>
  );
}
