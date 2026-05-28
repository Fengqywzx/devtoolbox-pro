// 声音的桥 — PWA 图标生成器（Node.js 版）
// 用法：node scripts/generate-icons.mjs
// 依赖：npm install sharp

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT = join(__dirname, '..', 'bridge-of-voices');
const ICONS_DIR = join(PROJECT, 'assets', 'icons');
const SIZES = [72, 96, 128, 144, 152, 192, 384, 512];

// 512x512 SVG 图标（矢量无损，任意缩放）
const SVG_512 = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#2563eb"/>
      <stop offset="100%" stop-color="#1e40af"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="92" fill="url(#bg)"/>
  <path d="M 86 205 A 179 179 0 0 1 426 205" fill="none" stroke="#93c5fd" stroke-width="16" stroke-linecap="round" opacity="0.5"/>
  <path d="M 52 178 A 220 220 0 0 1 460 178" fill="none" stroke="#93c5fd" stroke-width="16" stroke-linecap="round" opacity="0.3"/>
  <rect x="215" y="160" width="82" height="143" rx="37" fill="#bfdbfe"/>
  <line x1="233" y1="203" x2="279" y2="203" stroke="#1e40af" stroke-width="6" stroke-linecap="round"/>
  <line x1="233" y1="229" x2="279" y2="229" stroke="#1e40af" stroke-width="6" stroke-linecap="round"/>
  <line x1="233" y1="255" x2="279" y2="255" stroke="#1e40af" stroke-width="6" stroke-linecap="round"/>
  <path d="M 193 187 A 107 107 0 0 1 319 187" fill="none" stroke="#fbbf24" stroke-width="22" stroke-linecap="round"/>
</svg>`;

async function main() {
  let sharp;
  try {
    sharp = (await import('sharp')).default;
  } catch {
    console.log('❌ 未安装 sharp 库');
    console.log('   请运行：npm install sharp');
    console.log('   然后用浏览器打开 bridge-of-voices/generate-icons.html 一键下载');
    process.exit(1);
  }

  await mkdir(ICONS_DIR, { recursive: true });

  console.log('🔉 声音的桥 — 生成 PWA 图标\n');

  for (const size of SIZES) {
    const filename = `icon-${size}.png`;
    const filepath = join(ICONS_DIR, filename);

    await sharp(Buffer.from(SVG_512))
      .resize(size, size)
      .png({ quality: 95 })
      .toFile(filepath);

    console.log(`  ✅ ${filename}  (${size}×${size})`);
  }

  console.log(`\n📁 全部 ${SIZES.length} 个图标已生成到：`);
  console.log(`   ${ICONS_DIR}`);
  console.log('\n现在打开 index.html，浏览器地址栏会出现"安装"按钮。');
}

main().catch(err => {
  console.error('生成失败：', err.message);
  process.exit(1);
});
