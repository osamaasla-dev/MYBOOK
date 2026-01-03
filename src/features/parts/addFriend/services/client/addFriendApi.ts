import { apiDeleteR, apiPostR } from "@/lib/api";

export type FriendRequestInput = {
  username: string;
};

export type FriendRequestStatus =
  | "REQUESTED"
  | "CANCELED"
  | "ACCEPTED"
  | "REJECTED"
  | "REMOVED";

export type FriendRequestApiResponse<T extends FriendRequestStatus> = {
  message: string;
  status: T;
  requestId?: string;
};

type ApiMethod = "POST" | "DELETE";

// Generic API function to eliminate repetition
async function friendRequestApi<T extends FriendRequestStatus>(
  method: ApiMethod,
  endpoint: string
): Promise<FriendRequestApiResponse<T>> {
  const apiCall = method === "POST" ? apiPostR : apiDeleteR;

  const { data, message } = await apiCall<{
    status: T;
    requestId?: string;
  }>(endpoint);

  return {
    message,
    status: data.status,
    requestId: data.requestId,
  };
}

// Path builders
const buildFriendPath = (username: string, action: string) =>
  `/add-friend/${encodeURIComponent(username)}/${action}`;

// API functions using the generic helper
export const sendFriendRequestApi = (input: FriendRequestInput) =>
  friendRequestApi<"REQUESTED">("POST", buildFriendPath(input.username, "add"));

export const cancelFriendRequestApi = (input: FriendRequestInput) =>
  friendRequestApi<"CANCELED">(
    "DELETE",
    buildFriendPath(input.username, "cancel-request")
  );

export const acceptFriendRequestApi = (input: FriendRequestInput) =>
  friendRequestApi<"ACCEPTED">(
    "POST",
    buildFriendPath(input.username, "accept-request")
  );

export const rejectFriendRequestApi = (input: FriendRequestInput) =>
  friendRequestApi<"REJECTED">(
    "POST",
    buildFriendPath(input.username, "reject-request")
  );

export const unFriendApi = (input: FriendRequestInput) =>
  friendRequestApi<"REMOVED">(
    "DELETE",
    buildFriendPath(input.username, "unfriend")
  );

// Type aliases for backward compatibility
export type CancelFriendRequestApiResponse =
  FriendRequestApiResponse<"CANCELED">;
export type AcceptFriendRequestApiResponse =
  FriendRequestApiResponse<"ACCEPTED">;
export type RejectFriendRequestApiResponse =
  FriendRequestApiResponse<"REJECTED">;
export type UnFriendApiResponse = FriendRequestApiResponse<"REMOVED">;
