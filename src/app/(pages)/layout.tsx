import type { Metadata } from "next";
import "./globals.css";

import NextAuthSessionProvider from "@/components/SessionProvider";
import { getCachedSiteName } from "@/lib/settings";
import { Cairo } from "next/font/google";
import { Toaster } from "react-hot-toast";

const cairo = Cairo({ subsets: ["latin", "arabic"], weight: ["400", "700"] });

export async function generateMetadata(): Promise<Metadata> {
  // Fetch site name directly from Prisma settings
  const siteName = await getCachedSiteName();

  const base = (() => {
    try {
      return new URL(
        process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
      );
    } catch {
      return new URL("http://localhost:3000");
    }
  })();

  return {
    title: { default: siteName, template: `%s | ${siteName}` },
    description: `${siteName} - a modern social networking experience.`,
    metadataBase: base,
    applicationName: siteName,
    authors: [{ name: siteName }],
    creator: siteName,
    publisher: siteName,
    keywords: [
      "social",
      "social network",
      "friends",
      "posts",
      "chat",
      `${siteName}`,
      "nextjs",
      "react",
    ],
    category: "social networking",
    formatDetection: { email: false, address: false, telephone: false },
    alternates: { canonical: "/" },
    manifest: "/site.webmanifest",
    icons: {
      icon: [
        { url: "/favicon.ico", type: "image/x-icon" },
        { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
        { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      ],
      apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
      shortcut: ["/favicon.ico"],
    },
    openGraph: {
      title: siteName,
      description: `${siteName} - a modern social networking experience.`,
      url: base.origin,
      siteName,
      type: "website",
      locale: "en_US",
      images: [
        { url: "/og-image.png", width: 1200, height: 630, alt: siteName },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: siteName,
      description: `${siteName} - a modern social networking platform.`,
      creator: "@my_next_app",
      images: ["/og-image.png"],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
  };
}

// Next.js 15: move themeColor to viewport export
export const viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#0ea5e9" },
    { media: "(prefers-color-scheme: dark)", color: "#111827" },
  ],
} satisfies import("next").Viewport;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={cairo.className}>
        <NextAuthSessionProvider>
          <Toaster
            position="top-center"
            reverseOrder={false}
            toastOptions={{ duration: 2000 }}
          />

          {children}
        </NextAuthSessionProvider>
      </body>
    </html>
  );
}
