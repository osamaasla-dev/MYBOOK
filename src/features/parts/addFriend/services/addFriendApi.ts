import { apiDeleteR, apiPostR } from "@/lib/api";

export type FriendRequestInput = {
  username: string;
};

export type FriendRequestApiResponse = {
  message: string;
  status: "REQUESTED";
  requestId?: string;
};

export type CancelFriendRequestApiResponse = {
  message: string;
  status: "CANCELED";
  requestId?: string;
};

export type AcceptFriendRequestApiResponse = {
  message: string;
  status: "ACCEPTED";
  requestId?: string;
};

export type RejectFriendRequestApiResponse = {
  message: string;
  status: "REJECTED";
  requestId?: string;
};

export type RemoveFriendApiResponse = {
  message: string;
  status: "REMOVED";
  requestId?: string;
};

const buildFriendRequestPath = (username: string) =>
  `/add-friend/${encodeURIComponent(username)}/add`;

const buildCancelFriendRequestPath = (username: string) =>
  `/add-friend/${encodeURIComponent(username)}/cancel-request`;

const buildAcceptFriendRequestPath = (username: string) =>
  `/add-friend/${encodeURIComponent(username)}/accept-request`;

const buildRejectFriendRequestPath = (username: string) =>
  `/add-friend/${encodeURIComponent(username)}/reject-request`;

const buildRemoveFriendPath = (username: string) =>
  `/add-friend/${encodeURIComponent(username)}/unfriend`;

export async function sendFriendRequestApi({
  username,
}: FriendRequestInput): Promise<FriendRequestApiResponse> {
  const { data, message } = await apiPostR<{
    status: "REQUESTED";
    requestId?: string;
  }>(buildFriendRequestPath(username));

  return {
    message,
    status: data.status,
    requestId: data.requestId,
  };
}

export async function removeFriendApi({
  username,
}: FriendRequestInput): Promise<RemoveFriendApiResponse> {
  const { data, message } = await apiDeleteR<{
    status: "REMOVED";
    requestId?: string;
  }>(buildRemoveFriendPath(username));

  return {
    message,
    status: data.status,
    requestId: data.requestId,
  };
}

export async function rejectFriendRequestApi({
  username,
}: FriendRequestInput): Promise<RejectFriendRequestApiResponse> {
  const { data, message } = await apiPostR<{
    status: "REJECTED";
    requestId?: string;
  }>(buildRejectFriendRequestPath(username));

  return {
    message,
    status: data.status,
    requestId: data.requestId,
  };
}

export async function acceptFriendRequestApi({
  username,
}: FriendRequestInput): Promise<AcceptFriendRequestApiResponse> {
  const { data, message } = await apiPostR<{
    status: "ACCEPTED";
    requestId?: string;
  }>(buildAcceptFriendRequestPath(username));

  return {
    message,
    status: data.status,
    requestId: data.requestId,
  };
}

export async function cancelFriendRequestApi({
  username,
}: FriendRequestInput): Promise<CancelFriendRequestApiResponse> {
  const { data, message } = await apiDeleteR<{
    status: "CANCELED";
    requestId?: string;
  }>(buildCancelFriendRequestPath(username));

  return {
    message,
    status: data.status,
    requestId: data.requestId,
  };
}
