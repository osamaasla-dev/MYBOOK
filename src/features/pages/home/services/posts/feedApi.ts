import { apiGetR } from "@/lib/api";
import type { RankedFeedPage } from "@/features/pages/home/utils/posts/post-ranking";

import {
  buildHomeFeedQuery,
  type HomeFeedQueryParams,
} from "@/features/pages/home/utils/posts/feed";

export async function fetchHomeFeedPage(params: HomeFeedQueryParams) {
  const query = buildHomeFeedQuery(params);
  const path = `/home/posts${query}`;

  const { data } = await apiGetR<RankedFeedPage>(path);
  return data;
}
