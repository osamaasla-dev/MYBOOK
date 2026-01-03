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

export async function getRelationsPageMetadata(): Promise<Metadata> {
  const siteName = await getCachedSiteName();
  const base = resolveBase();
  const title = `Relations`;
  const description =
    "Explore your followers, friends, and requests in one place. Manage every relationship with clarity and control.";

  return {
    title,
    description,
    metadataBase: base,
    alternates: { canonical: "/user/relations" },
    openGraph: {
      title,
      description,
      url: new URL("/user/relations", base).toString(),
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
