import { prisma } from "@/lib/prisma";

export const getActor = async (userId: string) =>
  await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true, username: true },
  });
