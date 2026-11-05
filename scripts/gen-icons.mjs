// public/icon.svg를 PWA 매니페스트·favicon용 PNG로 구워서 public/에 저장한다.
// sharp는 devDependency — 아이콘을 다시 만들 때만 수동으로 돌리면 된다(빌드 시 자동 실행 안 됨).
import sharp from "sharp";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const svg = readFileSync(path.join(ROOT, "public", "icon.svg"));

const sizes = [
  ["icon-192.png", 192],
  ["icon-512.png", 512],
  ["apple-touch-icon.png", 180],
  ["favicon-32x32.png", 32],
];

for (const [name, size] of sizes) {
  await sharp(svg, { density: 384 }).resize(size, size).png().toFile(path.join(ROOT, "public", name));
  console.log("생성:", name);
}

// 마스커블 아이콘(배경이 꽉 찬 사각형이라 안전 영역을 위해 살짝 여백을 둠)
await sharp(svg, { density: 384 })
  .resize(460, 460)
  .extend({ top: 26, bottom: 26, left: 26, right: 26, background: "#e85a10" })
  .png()
  .toFile(path.join(ROOT, "public", "icon-maskable-512.png"));
console.log("생성: icon-maskable-512.png");
