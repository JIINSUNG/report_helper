import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "보고 도우미",
    short_name: "보고 도우미",
    description: "매장 오픈·마감 보고서, 판매 기록, 일정, 제품 가이드를 한 곳에서.",
    start_url: "/",
    display: "standalone",
    background_color: "#f3f4f6",
    theme_color: "#e85a10",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
