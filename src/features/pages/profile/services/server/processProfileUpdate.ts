import profileMessages from "@/lib/messages/profile";
import { deleteProfileCache } from "@/features/pages/profile/utils";
import {
  cleanupProfileMedia,
  getProfileMediaIdentifiers,
  updateUserProfile,
} from "@/features/pages/profile/services/server";
import type { Logger } from "pino";
import type { User } from "next-auth";
import type { UpdateProfileInput } from "../../schemas";

export async function processProfileUpdate({
  viewer,
  profileData,
  log,
}: {
  viewer: User;
  profileData: UpdateProfileInput;
  log: Logger;
}) {
  // Get current media for cleanup
  const currentMedia = await getProfileMediaIdentifiers(viewer.id);

  // Update user profile
  await deleteProfileCache(viewer.username);
  const updatedUser = await updateUserProfile(viewer.id, profileData);

  // Cleanup old media
  await cleanupProfileMedia({
    currentMedia,
    nextAvatarUrl: profileData.avatarUrl,
    nextAvatarPublicId: profileData.avatarPublicId,
    nextCoverUrl: profileData.coverUrl,
    nextCoverPublicId: profileData.coverPublicId,
    log,
  });

  log.info({ userId: viewer.id }, profileMessages.update.success);

  return updatedUser;
}
