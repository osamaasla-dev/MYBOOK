import {
  FRESH_POST_WINDOW_MS,
  VIEWER_FRESH_OVERRIDE_SCORE,
} from "@/features/pages/home/utils/posts/post-ranking";
import type { RankedPost } from "@/features/pages/home/utils/posts/post-ranking";

type ViewerFreshParams = {
  posts: RankedPost[];
  viewerId: string;
  now: Date;
};

export function extractViewerFreshPosts({
  posts,
  viewerId,
  now,
}: ViewerFreshParams) {
  if (!posts.length) {
    return { bucket: [] as RankedPost[], remaining: posts };
  }

  const freshCutoff = now.getTime() - FRESH_POST_WINDOW_MS;

  const bucket: RankedPost[] = [];
  const remaining: RankedPost[] = [];

  for (const post of posts) {
    if (
      post.authorId === viewerId &&
      post.publishedAt.getTime() >= freshCutoff
    ) {
      bucket.push({
        ...post,
        finalScore: VIEWER_FRESH_OVERRIDE_SCORE,
      });
      continue;
    }

    remaining.push(post);
  }

  bucket.sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime());

  return { bucket, remaining };
}
