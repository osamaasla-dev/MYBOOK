import { apiPutR } from "@/lib/api";
import type { UpdateProfileInput } from "../../schemas";
import type { ProfileUserRecord } from "../../types";

export async function updateCurrentUserProfile(data: UpdateProfileInput) {
  const { data: updatedProfile } = await apiPutR<ProfileUserRecord>(
    "/me/profile/update",
    data
  );
  return updatedProfile;
}
