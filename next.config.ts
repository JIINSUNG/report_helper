import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  // firebase-admin은 grpc 등 네이티브 의존성이 있어서 서버 번들에 끌려들어가면
  // Vercel 서버리스 함수에서 조용히 깨질 수 있다 — 번들링 대상에서 빼고 런타임에
  // node_modules에서 직접 require하게 둔다.
  serverExternalPackages: ["firebase-admin"],
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
