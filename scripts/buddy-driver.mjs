// buddy-pet driver — launch, screenshot, interact
// Usage: node scripts/buddy-driver.mjs [--screenshot-only] [--interact]
import { chromium } from 'playwright';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { mkdirSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT = join(__dirname, '..');
const HTML = join(PROJECT, 'buddy-pet.html');
const SHOT_DIR = join(PROJECT, 'screenshots');

try { mkdirSync(SHOT_DIR); } catch {}

const args = process.argv.slice(2);
const screenshotOnly = args.includes('--screenshot-only');
const interact = args.includes('--interact');

function fmtPet(pet) {
  if (!pet) return 'none';
  return `${pet.speciesKey} Lv${pet.level} ${pet.rarity}${pet.shiny ? '✨' : ''} petCount=${pet.petCount || 0} feedCount=${pet.feedCount || 0} trainCount=${pet.trainCount || 0} achievements=${(pet.achievements || []).length}`;
}

async function main() {
  let browser;
  try {
    browser = await chromium.launch({ headless: true, channel: 'msedge' });
    console.log('[driver] Using system Microsoft Edge.');
  } catch {
    browser = await chromium.launch({ headless: true });
    console.log('[driver] Using Playwright Chromium.');
  }
  const page = await browser.newPage({ viewport: { width: 800, height: 700 } });
  const fileUrl = 'file:///' + HTML.replace(/\\/g, '/');

  console.log('[driver] Opening', fileUrl);
  await page.goto(fileUrl, { waitUntil: 'networkidle', timeout: 15000 });

  await page.waitForSelector('#petCanvas', { timeout: 10000 });
  await page.waitForTimeout(1500);

  const ss1 = join(SHOT_DIR, '01-initial.png');
  await page.screenshot({ path: ss1, fullPage: false });
  console.log('[driver] Screenshot saved:', ss1);

  if (screenshotOnly) {
    await browser.close();
    console.log('[driver] Done (screenshot-only).');
    return;
  }

  const petBefore = await page.evaluate(() => {
    const d = localStorage.getItem('buddy_pet');
    return d ? JSON.parse(d) : null;
  });
  console.log('[driver] Pet state before:', fmtPet(petBefore));

  console.log('[driver] Clicking 抚摸...');
  await page.click('button:has-text("抚摸")');
  await page.waitForTimeout(800);

  console.log('[driver] Clicking 喂食...');
  await page.click('button:has-text("喂食")');
  await page.waitForTimeout(800);

  if (interact) {
    console.log('[driver] Clicking 训练...');
    await page.click('button:has-text("训练")');
    await page.waitForTimeout(800);

    console.log('[driver] Clicking 进化...');
    await page.click('button:has-text("进化")');
    await page.waitForTimeout(800);

    console.log('[driver] Clicking pet canvas...');
    await page.click('#petCanvas');
    await page.waitForTimeout(1000);
  }

  const petAfter = await page.evaluate(() => {
    const d = localStorage.getItem('buddy_pet');
    return d ? JSON.parse(d) : null;
  });
  console.log('[driver] Pet state after:', fmtPet(petAfter));

  const ss2 = join(SHOT_DIR, '02-after-interact.png');
  await page.screenshot({ path: ss2, fullPage: false });
  console.log('[driver] Screenshot saved:', ss2);

  const petSaved = await page.evaluate(() => {
    const d = localStorage.getItem('buddy_pet');
    return d ? JSON.parse(d) : null;
  });
  if (petSaved && (petSaved.petCount > 0 || petSaved.feedCount > 0)) {
    console.log('[driver] PASS: pet state persisted in localStorage.');
  } else {
    console.log('[driver] WARN: pet state may not have persisted.');
  }

  await browser.close();
  console.log('[driver] All done.');
}

main().catch(err => {
  console.error('[driver] FAIL:', err.message);
  process.exit(1);
});
