import { getCachedSiteName } from "@/lib/settings";
import type { Metadata } from "next";

function resolveBase(): URL {
  try {
    return new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000");
  } catch {
    return new URL("http://localhost:3000");
  }
}

export async function getSignInPageMetadata(): Promise<Metadata> {
  const siteName = await getCachedSiteName();
  const base = resolveBase();

  const title = "Sign In";
  const description = `Sign in to ${siteName} to see updates from friends, share posts, and stay connected.`;

  return {
    title: { default: title, template: `%s | ${siteName}` },
    description,
    metadataBase: base,
    alternates: { canonical: "/signin" },
    openGraph: {
      title: `${siteName} — ${title}`,
      description,
      url: new URL("/signin", base).toString(),
      siteName,
      type: "website",
      images: [
        { url: "/og-image.png", width: 1200, height: 630, alt: siteName },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${siteName} — ${title}`,
      description,
      images: ["/og-image.png"],
    },
    robots: {
      index: false,
      follow: false,
      googleBot: {
        index: false,
        follow: false,
        noimageindex: true,
        "max-snippet": 0,
        "max-image-preview": "none",
        "max-video-preview": 0,
      },
    },
  };
}
