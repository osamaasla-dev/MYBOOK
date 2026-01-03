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

export async function getUserHomePageMetadata(): Promise<Metadata> {
  const siteName = await getCachedSiteName();
  const base = resolveBase();
  const title = `Home Feed `;
  const description =
    "Catch up with friends, discover trending stories, and stay close to the conversations that matter most to you.";

  return {
    title,
    description,
    metadataBase: base,
    alternates: { canonical: "/user" },
    openGraph: {
      title,
      description,
      url: new URL("/user", base).toString(),
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
