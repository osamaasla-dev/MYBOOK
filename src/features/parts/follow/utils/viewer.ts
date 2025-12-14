import { prisma } from "@/lib/prisma";

export async function fetchViewerUsername(
  viewerId: string
): Promise<{ username: string; name: string } | null> {
  const viewer = await prisma.user.findUnique({
    where: { id: viewerId },
    select: { username: true, name: true },
  });

  return viewer ?? null;
}
