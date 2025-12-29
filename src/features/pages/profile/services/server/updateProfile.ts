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
      ...(data.coverUrl !== undefined && { coverUrl: data.coverUrl }),
    },
    select: {
      bio: true,
      avatarUrl: true,
      coverUrl: true,
    },
  });
}
