import { apiGetR } from "@/lib/api";
import type { FeedPostsPage } from "@/features/pages/home/utils/posts/feed-response";

import {
  buildHomeFeedQuery,
  type HomeFeedQueryParams,
} from "@/features/pages/home/utils/posts/feed";

export async function fetchHomeFeedPage(params: HomeFeedQueryParams) {
  const query = buildHomeFeedQuery(params);
  const path = `/home/posts${query}`;

  const { data } = await apiGetR<FeedPostsPage>(path);
  return data;
}
