import { apiDeleteR, apiPostR } from "@/lib/api";

export type BlockUserActionInput = {
  username: string;
};

export type BlockUserApiResponse = {
  blockedUserId: string;
};

export async function blockUserApi({
  username,
}: BlockUserActionInput): Promise<BlockUserApiResponse> {
  const path = `/block/${encodeURIComponent(username)}`;
  const { data } = await apiPostR<BlockUserApiResponse>(path);
  return data;
}

export type UnblockUserApiResponse = {
  unblockedUserId: string;
};

export async function unblockUserApi({
  username,
}: BlockUserActionInput): Promise<UnblockUserApiResponse> {
  const path = `/block/${encodeURIComponent(username)}`;
  const { data } = await apiDeleteR<UnblockUserApiResponse>(path);
  return data;
}
