import type {
  PostFetchResult,
  PostWithStats,
} from "@/features/pages/home/utils/posts/post-ranking/types";

export function groupPostsByAuthor(
  posts: PostWithStats[],
  perUserLimit: number
): PostFetchResult[] {
  const grouped = new Map<string, PostWithStats[]>();

  for (const post of posts) {
    const list = grouped.get(post.authorId) ?? [];
    if (list.length < perUserLimit) {
      list.push(post);
      grouped.set(post.authorId, list);
    }
  }

  return Array.from(grouped.entries()).map(([authorId, authorPosts]) => ({
    authorId,
    posts: authorPosts,
  }));
}
