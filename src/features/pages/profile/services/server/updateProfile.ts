import { prisma } from "@/lib/prisma";
import type { UpdateProfileInput } from "../../schemas";

export async function updateUserProfile(
  userId: string,
  data: UpdateProfileInput
) {
  return prisma.user.update({
    where: { id: userId },
    data: {
      ...(data.bio !== undefined && { bio: data.bio }),
      ...(data.avatarUrl !== undefined && { avatarUrl: data.avatarUrl }),
      ...(data.avatarPublicId !== undefined && {
        avatarPublicId: data.avatarPublicId,
      }),
      ...(data.coverUrl !== undefined && { coverUrl: data.coverUrl }),
      ...(data.coverPublicId !== undefined && {
        coverPublicId: data.coverPublicId,
      }),
    },
    select: {
      bio: true,
      avatarUrl: true,
      avatarPublicId: true,
      coverUrl: true,
      coverPublicId: true,
    },
  });
}

export async function getProfileMediaIdentifiers(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      avatarUrl: true,
      avatarPublicId: true,
      coverUrl: true,
      coverPublicId: true,
    },
  });
}
