import { Visibility, PostVisibilityPreference } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export function resolveEffectiveVisibility(
  postVisibility: Visibility,
  preference: PostVisibilityPreference,
  authorDefaultVisibility: Visibility
) {
  return preference === PostVisibilityPreference.OVERRIDE
    ? postVisibility
    : authorDefaultVisibility;
}

export async function loadAuthorPrivacyDefaults(authorIds: string[]) {
  if (!authorIds.length) return new Map<string, Visibility>();

  const privacySettings = await prisma.privacySetting.findMany({
    where: { userId: { in: authorIds } },
    select: { userId: true, postsVisibility: true },
  });

  const map = new Map<string, Visibility>();
  for (const setting of privacySettings) {
    map.set(setting.userId, setting.postsVisibility);
  }

  return map;
}
