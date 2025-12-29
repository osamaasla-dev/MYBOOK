import { apiDeleteR, apiPostR, apiPutR } from "@/lib/api";

import type { CreatePostInput } from "../../schemas";
import type {
  CreatePostResponseData,
  PostReactionResponse,
  RecordPostViewResponse,
} from "../../types";
import type { PostReactionType } from "../../constants/reactions";

const CREATE_POST_ENDPOINT = "/post/create";

const buildPostViewEndpoint = (postId: string) =>
  `/post/${encodeURIComponent(postId)}/view`;

const buildPostReactionCreateEndpoint = (postId: string) =>
  `/post/${encodeURIComponent(postId)}/reactions/create`;

const buildPostReactionDeleteEndpoint = (postId: string) =>
  `/post/${encodeURIComponent(postId)}/reactions/delete`;

const buildPostDeleteEndpoint = (postId: string) =>
  `/post/${encodeURIComponent(postId)}/delete`;

const buildPostUpdateEndpoint = (postId: string) =>
  `/post/${encodeURIComponent(postId)}/update`;

export async function submitCreatePost(
  input: CreatePostInput
): Promise<CreatePostResponseData> {
  const { data } = await apiPostR<CreatePostResponseData>(
    CREATE_POST_ENDPOINT,
    input
  );
  return data;
}

export async function reactToPostApi(
  postId: string,
  reaction: PostReactionType
): Promise<PostReactionResponse> {
  const { data } = await apiPostR<PostReactionResponse>(
    buildPostReactionCreateEndpoint(postId),
    { reaction }
  );
  return data;
}

export async function removePostReactionApi(
  postId: string
): Promise<PostReactionResponse> {
  const { data } = await apiDeleteR<PostReactionResponse>(
    buildPostReactionDeleteEndpoint(postId)
  );
  return data;
}

export async function recordPostViewApi(
  postId: string
): Promise<RecordPostViewResponse> {
  const { data } = await apiPostR<RecordPostViewResponse>(
    buildPostViewEndpoint(postId),
    {}
  );
  return data;
}

export async function deletePostApi(postId: string): Promise<void> {
  if (!postId) throw new Error("Post ID is required");
  await apiDeleteR<void>(buildPostDeleteEndpoint(postId));
}

export async function submitUpdatePost(
  postId: string,
  input: CreatePostInput
): Promise<CreatePostResponseData> {
  if (!postId) throw new Error("Post ID is required");
  const { data } = await apiPutR<CreatePostResponseData>(
    buildPostUpdateEndpoint(postId),
    input
  );
  return data;
}
