import { apiDeleteR, apiPostR } from "@/lib/api";

import type { FollowActionInput, FollowApiResponse } from "../types";

const buildFollowPath = (
  username: string,
  action:
    | "follow"
    | "unfollow"
    | "cancel-request"
    | "accept-request"
    | "reject-request"
) => `/follow/${encodeURIComponent(username)}/${action}`;

export async function followUserApi({
  username,
}: FollowActionInput): Promise<FollowApiResponse> {
  const { data, message } = await apiPostR<{
    status: "FOLLOWED" | "REQUESTED";
    requestId?: string;
  }>(buildFollowPath(username, "follow"));

  return {
    message,
    status: data.status,
    requestId: data.requestId,
  };
}

export async function acceptFollowRequestApi({
  username,
}: FollowActionInput): Promise<FollowApiResponse> {
  const { data, message } = await apiPostR<{ status: "APPROVED" }>(
    buildFollowPath(username, "accept-request")
  );

  return {
    message,
    status: data.status,
  };
}

export async function rejectFollowRequestApi({
  username,
}: FollowActionInput): Promise<FollowApiResponse> {
  const { data, message } = await apiPostR<{ status: "REJECTED" }>(
    buildFollowPath(username, "reject-request")
  );

  return {
    message,
    status: data.status,
  };
}

export async function unfollowUserApi({
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

export async function cancelFollowRequestApi({
  username,
}: FollowActionInput): Promise<FollowApiResponse> {
  const { data, message } = await apiDeleteR<{ status: "CANCELLED" }>(
    buildFollowPath(username, "cancel-request")
  );

  return {
    message,
    status: data.status,
  };
}
