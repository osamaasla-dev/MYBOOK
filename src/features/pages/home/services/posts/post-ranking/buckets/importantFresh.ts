import {
  FRESH_POST_WINDOW_MS,
  IMPORTANT_FRESH_OVERRIDE_SCORE,
} from "@/features/pages/home/utils/posts/post-ranking";
import type { RankedPost } from "@/features/pages/home/utils/posts/post-ranking";

type ImportantFreshParams = {
  posts: RankedPost[];
  topImportantUserIds: Set<string>;
  viewerId: string;
  now: Date;
};

export function extractImportantFreshPosts({
  posts,
  topImportantUserIds,
  viewerId,
  now,
}: ImportantFreshParams) {
  if (!posts.length || !topImportantUserIds.size) {
    return { bucket: [] as RankedPost[], remaining: posts };
  }

  const freshCutoff = now.getTime() - FRESH_POST_WINDOW_MS;

  const bucket: RankedPost[] = [];
  const remaining: RankedPost[] = [];

  for (const post of posts) {
    if (
      post.authorId !== viewerId &&
      topImportantUserIds.has(post.authorId) &&
      post.publishedAt.getTime() >= freshCutoff
    ) {
      bucket.push({
        ...post,
        finalScore: IMPORTANT_FRESH_OVERRIDE_SCORE,
      });
      continue;
    }

    remaining.push(post);
  }

  bucket.sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime());

  return { bucket, remaining };
}
