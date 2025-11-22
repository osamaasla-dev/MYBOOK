import { apiGetR } from "@/lib/api";
import type { ProfileRouteData } from "../types";

export async function getProfileByUsername(username: string) {
  const encoded = encodeURIComponent(username);
  const { data } = await apiGetR<ProfileRouteData>(`/profile/${encoded}`);
  return data;
}
