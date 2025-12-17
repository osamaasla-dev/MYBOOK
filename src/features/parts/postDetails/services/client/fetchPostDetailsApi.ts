import { apiGetR } from "@/lib/api";
import type { FeedPost } from "@/features/pages/home/utils/posts/feed-response";

type PostDetailsResponse = {
  post: FeedPost;
};

const buildPostDetailsEndpoint = (postId: string) =>
  `/post/${encodeURIComponent(postId)}/details`;

export async function fetchPostDetailsRequest(
  postId: string
): Promise<FeedPost> {
  const endpoint = buildPostDetailsEndpoint(postId);
  const { data } = await apiGetR<PostDetailsResponse>(endpoint);
  return data.post;
}
