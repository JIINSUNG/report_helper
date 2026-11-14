import { test, expect } from "@playwright/test";

/**
 * 지난 보고서 불러오기(마감·오픈)와 응대 탭 "잘 먹힌 멘트" 노트 E2E. 게스트로 들어가서 로컬 전용 데이터
 * (localStorage)만 쓴다 — 공유 컬렉션은 건드리지 않는다.
 */

function ymd(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

test("지난 마감보고 → 오늘 마감·오픈으로 불러오기, 멘트 기록·+1", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));

  const y = new Date();
  y.setDate(y.getDate() - 1);
  const yesterday = ymd(y);
  const seed = {
    closes: {
      [yesterday]: {
        date: yesterday,
        dayTargetGMV: 0,
        dayGMV: 0,
        monthTargetGMV: 0,
        monthGMV: 0,
        items: [{ name: "스마트폰", target: 1, actual: 1 }],
        traffic: 0,
        visitors: 0,
        conversion: "",
        attachRate: "",
        aov: "",
        inventoryNote: "",
        retail: 0,
        pos: 0,
        reasons: [],
        highlights: [{ t: "e2e 핵심 내용", b: ["체험존 정리"] }],
        phoneInsights: [],
        plans: [{ t: "e2e 익일 계획", b: ["가격표 교체"] }],
        note: "e2e 특이사항",
      },
    },
  };
  await page.addInitScript((s) => {
    if (!window.localStorage.getItem("report-helper:v1")) window.localStorage.setItem("report-helper:v1", s);
  }, JSON.stringify(seed));

  await page.goto("/");
  await page.getByRole("button", { name: "게스트로 둘러보기" }).click();
  await page.getByRole("button", { name: "게스트로 입장" }).click();
  await expect(page.getByText("로그아웃")).toBeVisible({ timeout: 10000 });

  // 마감 — 어제 마감보고의 핵심 내용·계획·특이사항을 가져온다
  await page.locator("nav button", { hasText: "마감" }).first().click();
  await page.getByRole("button", { name: "📂 지난 보고서 불러오기" }).click();
  await page.getByRole("button", { name: "가져오기" }).click();
  await expect(page.getByText(/3개 칸을 가져왔어요/)).toBeVisible();
  // 가져온 섹션 제목이 입력칸 값으로 들어갔는지
  const titles = await page.locator("input, textarea").evaluateAll((els) => els.map((e) => (e as HTMLInputElement).value));
  expect(titles).toEqual(expect.arrayContaining(["e2e 핵심 내용", "e2e 익일 계획"]));
  await page.screenshot({ path: test.info().outputPath("close-loaded.png") });

  // 되돌리기
  await page.getByRole("button", { name: "되돌리기" }).click();
  await expect(page.getByText("되돌렸어요.")).toBeVisible();

  // 오픈 — 어제 익일 계획을 오늘 코멘트로
  await page.locator("nav button", { hasText: "오픈" }).first().click();
  await page.getByRole("button", { name: "📂 지난 보고서 불러오기" }).click();
  await page.getByRole("button", { name: "가져오기" }).click();
  await expect(page.locator("#o-cm")).toHaveValue(/e2e 익일 계획/);

  // 응대 — 멘트 기록 → +1
  await page.locator("nav button", { hasText: "응대" }).first().click();
  await page.getByRole("button", { name: "+ 멘트 기록하기" }).click();
  await page.getByLabel("멘트", { exact: true }).fill("e2e 사진 한번 찍어보실래요?");
  await page.getByRole("button", { name: "제품 설명" }).click();
  await page.getByLabel("제품·카테고리").fill("스마트폰");
  await page.locator(".box", { has: page.getByLabel("멘트", { exact: true }) }).getByRole("button", { name: "저장" }).click();
  await expect(page.getByText("“e2e 사진 한번 찍어보실래요?”")).toBeVisible();
  await page.getByRole("button", { name: /또 먹혔어요/ }).click();
  await expect(page.getByRole("button", { name: "또 먹혔어요, 지금 2번" })).toBeVisible();
  await page.locator("section.card", { hasText: "잘 먹힌 멘트" }).screenshot({ path: test.info().outputPath("pitch.png") });

  // 새로고침해도 남아 있다
  await page.reload();
  await page.locator("nav button", { hasText: "응대" }).first().click();
  await expect(page.getByText("“e2e 사진 한번 찍어보실래요?”")).toBeVisible();

  expect(errors).toEqual([]);
});
