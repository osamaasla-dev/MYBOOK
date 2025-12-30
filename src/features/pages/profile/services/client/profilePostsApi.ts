import { apiGetR } from "@/lib/api";
import type { FeedPost } from "@/features/pages/home/utils/posts/feed-response";

export type ProfilePostsPage = {
  posts: FeedPost[];
  nextCursor: string | null;
};

export type FetchProfilePostsOptions = {
  username: string;
  cursor?: string;
  limit: number;
};

export async function fetchProfilePostsPage({
  username,
  cursor,
  limit,
}: FetchProfilePostsOptions): Promise<ProfilePostsPage> {
  const searchParams = new URLSearchParams();
  searchParams.set("limit", limit.toString());
  if (cursor) {
    searchParams.set("cursor", cursor);
  }

  const { data } = await apiGetR<ProfilePostsPage>(
    `/profile/${username}/posts?${searchParams.toString()}`
  );

  return data;
}
