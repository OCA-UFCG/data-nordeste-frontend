import type { Metadata } from "next";
import { Lato } from "next/font/google";
import { GoogleAnalytics } from "@next/third-parties/google";
import {
  buildMetadata,
  SITE_DESCRIPTION,
  SITE_NAME,
  siteUrl,
} from "@/config/seo";

import "./globals.css";

const NEXT_PUBLIC_GA_ID = process.env.NEXT_PUBLIC_GA_ID ?? "";
const lato = Lato({
  weight: ["400", "700", "900"],
  subsets: ["latin"],
  style: ["normal", "italic"],
});

const IS_BETA = process.env.NEXT_PUBLIC_APP_ENV === "beta";

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
  icons: {
    icon: "datane-logo.png",
    shortcut: "datane-logo.png",
    apple: "datane-logo.png",
  },
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
      <link rel="icon" href="/favicon.ico" sizes="any" />
      <body className={lato.className}>{children}</body>

      <GoogleAnalytics gaId={NEXT_PUBLIC_GA_ID} />
    </html>
  );
}
