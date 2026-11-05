import { test, expect } from "@playwright/test";

/**
 * 직원·게스트·관리자 로그인과 핵심 로컬 전용 흐름(오픈 보고·할일)이 에러 없이 끝나는지 확인하는
 * 핵심 흐름 E2E 테스트. 실제 운영 Firebase 프로젝트에 붙지만, 공유 컬렉션(일정·제품·공유방·창고)은
 * 절대 쓰지 않고 읽기만 한다 — 로컬 전용 탭(오픈/기록/마감/세일즈/회고/할일)은 localStorage에만
 * 저장되니 안전하게 직접 조작해서 확인한다.
 */

const STORE_CODE = "260306";
const POS_ID = "1030";

function trackErrors(page: import("@playwright/test").Page) {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => {
    if (m.type() !== "error") return;
    const text = m.text();
    if (text.includes("net::ERR_") || text.includes("favicon")) return;
    // 로그아웃 순간 공유 데이터 onSnapshot 구독이 React cleanup으로 끊기기 전에 한 번 더 응답이
    // 와서 permission-denied가 찍히는 벤치마크성 레이스 — 화면엔 아무 영향 없는 콘솔 경고라 무시한다.
    if (text.includes("permission-denied") && text.includes("Uncaught Error in snapshot listener")) return;
    errors.push(text);
  });
  return errors;
}

test("직원 로그인 → 오픈 보고 로컬 입력 → 할일 탭 → 로그아웃", async ({ page }) => {
  const errors = trackErrors(page);

  await page.goto("/");
  await expect(page.getByRole("button", { name: "직원으로 로그인" })).toBeVisible();

  await page.getByRole("button", { name: "직원으로 로그인" }).click();
  await page.getByPlaceholder("yymmdd").fill(STORE_CODE);
  await page.getByPlaceholder("예: 1004").fill(POS_ID);
  await page.getByRole("button", { name: "입장" }).click();

  await expect(page.getByText("로그아웃")).toBeVisible({ timeout: 10000 });

  // 오픈 탭 — 코멘트는 로컬에만 저장되니 직접 써보고 값이 남아있는지 확인
  await page.locator("nav button", { hasText: "오픈" }).first().click();
  const comment = page.locator("#o-cm");
  await expect(comment).toBeVisible();
  const note = "e2e 테스트 메모 " + Date.now();
  await comment.fill(note);
  await page.locator("nav button", { hasText: "기록" }).first().click();
  await page.locator("nav button", { hasText: "오픈" }).first().click();
  await expect(comment).toHaveValue(note);
  // 남겨두지 않도록 바로 지운다
  await comment.fill("");

  // 할일 탭 — 예시 목록으로 시작해서 항목이 실제로 뜨는지 확인
  await page.locator("nav button", { hasText: "할일" }).first().click();
  const startBtn = page.getByRole("button", { name: /예시 목록으로 시작/ });
  if (await startBtn.count()) {
    await startBtn.click();
  }
  await expect(page.locator(".card").first()).toBeVisible();

  // 브리핑 — 항목 하나를 체크하고 브리핑을 열면 "오늘 한 일"에 그 항목이 들어가는지 확인.
  // 공유방에 실제로 올리는 건 수동으로 지울 수 있는 관리자가 있어야 해서 여기선 테스트하지 않는다
  // (매번 돌릴 때마다 정리 안 되는 공지가 쌓이면 안 됨).
  const chk = page.locator("button.chk").first();
  const checkedText = await chk.getAttribute("aria-label");
  await chk.click();
  await page.getByRole("button", { name: "📋 오늘 브리핑 만들기" }).click();
  await expect(page.getByRole("heading", { name: "오늘 브리핑" })).toBeVisible();
  await page.locator(".sheet button", { hasText: "미리보기" }).click();
  const doneSection = (await page.locator("pre").innerText()).split("[해야 할 일]")[0];
  expect(doneSection).toContain(checkedText);
  await page.getByRole("button", { name: "닫기" }).first().click();
  await chk.click(); // 테스트 흔적 남기지 않도록 다시 체크 해제

  // 창고 탭 — 실제 매장 데이터가 있으니 읽기만 한다(칸을 열거나 고치지 않음)
  await page.locator("nav button", { hasText: "창고" }).first().click();
  await expect(page.getByText("창고 둘러보기")).toBeVisible();

  await page.getByRole("button", { name: "로그아웃" }).click();
  await expect(page.getByRole("button", { name: "직원으로 로그인" })).toBeVisible();

  expect(errors, "콘솔 에러/페이지 에러가 없어야 함:\n" + errors.join("\n")).toEqual([]);
});

test("게스트로 둘러보기 → 제품 탭만 보임 → 로그아웃", async ({ page }) => {
  const errors = trackErrors(page);

  await page.goto("/");
  await page.getByRole("button", { name: "게스트로 둘러보기" }).click();
  await page.getByRole("button", { name: "게스트로 입장" }).click();

  await expect(page.getByText("로그아웃")).toBeVisible({ timeout: 10000 });
  // 게스트는 공유방·일정 탭이 숨어 있어야 함
  await expect(page.locator("nav button", { hasText: "공유" })).toHaveCount(0);
  await expect(page.locator("nav button", { hasText: "일정" })).toHaveCount(0);

  await page.getByRole("button", { name: "로그아웃" }).click();
  await expect(page.getByRole("button", { name: "직원으로 로그인" })).toBeVisible();

  expect(errors, "콘솔 에러/페이지 에러가 없어야 함:\n" + errors.join("\n")).toEqual([]);
});

// 로그인 API는 IP+uid 기준 5회 실패하면 10분 잠기므로(스펙 §1), 이 테스트를 10분 안에 5번 넘게
// 돌리면 "아이디 또는 비밀번호가 맞지 않아요" 대신 잠금 메시지가 뜨면서 실패할 수 있다 — 실제 버그가
// 아니라 레이트리밋이 의도대로 동작하는 거니 잠시 기다렸다 다시 돌리면 된다.
test("관리자 로그인 폼이 뜨고, 틀린 비밀번호는 거부된다", async ({ page }) => {
  const errors = trackErrors(page);

  await page.goto("/");
  await page.getByRole("button", { name: "관리자 로그인" }).click();
  await page.locator("#lg-id").fill("존재하지않는아이디");
  await page.locator('input[type="password"]').fill("틀린비밀번호");
  await page.getByRole("button", { name: "로그인", exact: true }).click();

  await expect(page.getByText("아이디 또는 비밀번호가 맞지 않아요.")).toBeVisible({ timeout: 10000 });
  await expect(page.getByText("로그아웃")).toHaveCount(0);

  // 이 테스트는 일부러 틀린 비밀번호를 보내는 거라 401 응답 자체가 기대한 결과다.
  const realErrors = errors.filter((e) => !e.includes("401"));
  expect(realErrors, "콘솔 에러/페이지 에러가 없어야 함:\n" + realErrors.join("\n")).toEqual([]);
});
