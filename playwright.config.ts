import { defineConfig, devices } from "@playwright/test";

// 프로덕션 빌드(next build && next start)로 띄운다 — next dev는 HMR 웹소켓이 재연결을 계속 시도해서
// 서비스 워커·오프라인 동작이 dev 모드에서만 이상하게 보일 수 있다(실제로 한 번 겪었음).
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  retries: 0,
  reporter: "line",
  timeout: 30000,
  use: {
    baseURL: "http://localhost:3100",
    viewport: { width: 390, height: 844 },
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "npm run build && npm run start -- -p 3100",
    url: "http://localhost:3100",
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
