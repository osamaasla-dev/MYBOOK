import { apiGetR } from "@/lib/api";

import type {
  PostReactionsResponse,
  ReactionTab,
} from "@/features/parts/post/services/server/reactions";

const buildPostReactionsEndpoint = (postId: string) =>
  `/post/${encodeURIComponent(postId)}/reactions`;

export type FetchPostReactionsPageInput = {
  postId: string;
  tab?: ReactionTab;
  limit?: number;
  cursor?: string;
};

export async function fetchPostReactionsPage({
  postId,
  tab = "all",
  limit,
  cursor,
}: FetchPostReactionsPageInput): Promise<PostReactionsResponse> {
  const endpoint = buildPostReactionsEndpoint(postId);
  const { data } = await apiGetR<PostReactionsResponse>(endpoint, {
    params: {
      tab,
      limit,
      cursor,
    },
  });
  return data;
}
