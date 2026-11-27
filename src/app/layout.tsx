import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { GoogleAnalytics } from "@next/third-parties/google";
import { VLibras } from "@/components/VLibras/VLibras";
import {
  buildMetadata,
  SITE_DESCRIPTION,
  SITE_NAME,
  siteUrl,
} from "@/config/seo";

import "./globals.css";

const NEXT_PUBLIC_GA_ID = process.env.NEXT_PUBLIC_GA_ID ?? "";
const inter = Inter({
  weight: ["400", "500", "600", "700", "800", "900"],
  subsets: ["latin"],
  style: ["normal", "italic"],
});

const IS_BETA = process.env.NEXT_PUBLIC_APP_ENV === "beta";

export const revalidate = 600;

export const metadata: Metadata = {
  ...buildMetadata({
    description: SITE_DESCRIPTION,
  }),
  metadataBase: new URL(siteUrl),
  applicationName: SITE_NAME,
  keywords: [
    "Data Nordeste",
    "SUDENE",
    "dados Nordeste",
    "indicadores Nordeste",
    "semiarido",
    "desenvolvimento regional",
    "dados abertos",
  ],

  // IMPORTANT: the tab icons come from the file conventions in src/app
  // (favicon.ico, icon.svg, apple-icon.png), which Next emits with absolute
  // URLs on every route. Do not reintroduce an `icons` field here: the old
  // relative "datane-logo.png" resolved to /posts/datane-logo.png and similar
  // 404s on nested routes.
  robots: {
    index: !IS_BETA,
    follow: !IS_BETA,
    nocache: false,
    googleBot: {
      "index": !IS_BETA,
      "follow": !IS_BETA,
      "noimageindex": false,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-br">
      <body className={inter.className}>
        {children}
        <VLibras />
      </body>

      <GoogleAnalytics gaId={NEXT_PUBLIC_GA_ID} />
    </html>
  );
}
