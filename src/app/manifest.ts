import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "보고 도우미",
    short_name: "보고 도우미",
    description: "매장 오픈·마감 보고서, 판매 기록, 일정, 제품 가이드를 한 곳에서.",
    start_url: "/",
    display: "standalone",
    background_color: "#f3f4f6",
    // manifest는 미디어 쿼리로 라이트/다크를 못 나누니, 실제 배경색(--bg, 라이트)에 맞춰서
    // 홈 화면 아이콘으로 켰을 때 상태바가 따로 뜨는 주황색 띠처럼 보이지 않게 한다.
    theme_color: "#f3f4f6",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
