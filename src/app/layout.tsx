import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { IBM_Plex_Sans_KR } from "next/font/google";
import "./globals.css";

const plexSansKr = IBM_Plex_Sans_KR({
  variable: "--font-ibm-plex-sans-kr",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "보고 도우미",
  description: "매장 오픈·마감 보고서, 판매 기록, 일정, 제품 가이드를 한 곳에서.",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "보고 도우미",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#e85a10",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ko" className={plexSansKr.variable}>
      <body>{children}</body>
    </html>
  );
}
