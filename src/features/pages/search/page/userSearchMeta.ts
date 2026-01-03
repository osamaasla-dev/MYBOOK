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

export async function getUserSearchPageMetadata(
  query?: string
): Promise<Metadata> {
  const siteName = await getCachedSiteName();
  const base = resolveBase();
  const formattedQuery = query?.trim();

  const title = formattedQuery ? `Search "${formattedQuery}"` : `Search People`;
  const description = formattedQuery
    ? `Discover people related to "${formattedQuery}" with prioritized results across friends, followers, and suggested connections.`
    : "Search across your network to reconnect with friends, followers, and new suggestions.";

  const url = formattedQuery
    ? new URL(
        `/user/search?query=${encodeURIComponent(formattedQuery)}`,
        base
      ).toString()
    : new URL("/user/search", base).toString();

  return {
    title,
    description,
    metadataBase: base,
    alternates: { canonical: "/user/search" },
    openGraph: {
      title,
      description,
      url,
      siteName,
      type: "website",
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
