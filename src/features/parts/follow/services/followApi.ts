import { apiDeleteR, apiPostR } from "@/lib/api";

import type { FollowActionInput, FollowApiResponse } from "../types";

const buildFollowPath = (username: string, action: "follow" | "unfollow") =>
  `/follow/${encodeURIComponent(username)}/${action}`;

export async function followUser({
  username,
}: FollowActionInput): Promise<FollowApiResponse> {
  const { data, message } = await apiPostR<{ status: "FOLLOWED" }>(
    buildFollowPath(username, "follow")
  );

  return {
    message,
    status: data.status,
  };
}

export async function unfollowUser({
  username,
}: FollowActionInput): Promise<FollowApiResponse> {
  const { data, message } = await apiDeleteR<{ status: "UNFOLLOWED" }>(
    buildFollowPath(username, "unfollow")
  );

  return {
    message,
    status: data.status,
  };
}
