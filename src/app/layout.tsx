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
    // "black-translucent": iOS가 자체 상태바 배경을 그리지 않고 페이지가 그 밑까지 깔리게 둠.
    // globals.css의 body::before가 safe-area-inset-top 영역을 --bg로 직접 칠해주므로 이게 맞다.
    statusBarStyle: "black-translucent",
    title: "보고 도우미",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  // 라이트/다크 각각의 실제 배경색(globals.css --bg와 동일)으로 — 고정 주황색이면
  // 상태바/노치 영역만 앱 배경과 다른 색으로 떠서 어색해 보인다.
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f3f4f6" },
    { media: "(prefers-color-scheme: dark)", color: "#111214" },
  ],
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ko" className={plexSansKr.variable}>
      <body>{children}</body>
    </html>
  );
}
