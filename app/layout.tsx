import type { Metadata } from "next";
import { SITE_DESCRIPTION, SITE_NAME, SITE_TAGLINE, SITE_URL } from "@/src/site";
import { THEME_BOOT } from "./theme-boot";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} · ${SITE_TAGLINE}`,
    template: `%s · ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  /*
   * No title or description here on purpose: Next fills og:title and og:description
   * from each page's own title and description when these are absent, so a shared
   * concept page previews as that concept rather than as the homepage. The image
   * comes from app/opengraph-image.tsx and is inherited by every route.
   */
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    locale: "en_GB",
  },
  twitter: {
    card: "summary_large_image",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // suppressHydrationWarning: the boot script may set data-theme before React
    // hydrates, which is intended and would otherwise be reported as a mismatch.
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOT }} />
      </head>
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
