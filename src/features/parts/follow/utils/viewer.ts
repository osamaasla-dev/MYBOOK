import { prisma } from "@/lib/prisma";

export async function fetchViewerUsername(
  viewerId: string
): Promise<string | null> {
  const viewer = await prisma.user.findUnique({
    where: { id: viewerId },
    select: { username: true },
  });

  return viewer?.username ?? null;
}
