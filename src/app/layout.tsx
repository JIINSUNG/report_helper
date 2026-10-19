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
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ko" className={plexSansKr.variable}>
      <body>{children}</body>
    </html>
  );
}
