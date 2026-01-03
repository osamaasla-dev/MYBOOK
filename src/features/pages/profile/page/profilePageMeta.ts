"use server";

import type { Metadata } from "next";
import { getCachedSiteName } from "@/lib/settings";

function resolveBase(): URL {
  try {
    return new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000");
  } catch {
    return new URL("http://localhost:3000");
  }
}

export async function getProfilePageMetadata(
  username?: string
): Promise<Metadata> {
  const siteName = await getCachedSiteName();
  const base = resolveBase();
  const profileName = username ? `@${username}` : "Profile";
  const title = `${profileName}`;
  const description = username
    ? `See ${profileName}'s posts, stories, and latest activity on ${siteName}.`
    : `Explore profiles on ${siteName} to see what friends are sharing.`;

  const url = username
    ? new URL(`/user/profile/${username}`, base).toString()
    : new URL("/user/profile", base).toString();

  return {
    title,
    description,
    metadataBase: base,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      siteName,
      type: "profile",
      images: [
        { url: "/og-image.png", width: 1200, height: 630, alt: siteName },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/og-image.png"],
    },
  };
}
