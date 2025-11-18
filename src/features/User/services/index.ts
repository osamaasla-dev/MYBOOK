import { apiGetR } from "@/lib/api";
import type { CurrentUser } from "../types";

export async function getCurrentUser() {
  const { data } = await apiGetR<CurrentUser>("/users/user");
  return data;
}
