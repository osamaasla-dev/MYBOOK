import { prisma } from "@/lib/prisma";
import { unstable_cache } from "next/cache";

export const SETTINGS_TAG = "settings" as const;

export type SiteSettings = {
  siteName: string | null;
};

// Shared cached accessor for site settings
export const getCachedSiteSettings = unstable_cache(
  async (): Promise<SiteSettings | null> => {
    return prisma.setting.findUnique({
      where: { id: "default" },
      select: { siteName: true },
    });
  },
  ["settings", "siteName"],
  {
    // 24 hours; adjust per business needs
    revalidate: 3600 * 24,
    tags: [SETTINGS_TAG],
  }
);

export async function getCachedSiteName(): Promise<string> {
  const s = await getCachedSiteSettings();
  return s?.siteName ?? "MYBOOK";
}
