import { createRequire } from 'node:module';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { strict as assert } from 'node:assert';

// Settings (all optional):
//   UI_TEST_BASE     where the site is running (default http://127.0.0.1:4174)
//   UI_TEST_FOCUSED  1 = only the workflow checks, reusing earlier results
//   PLAYWRIGHT_PATH  folder of an existing playwright install, if it is not in node_modules
//   PW_EXECUTABLE    path to a browser executable, if Playwright's own browser is not installed
const require = createRequire(import.meta.url);
function loadPlaywright() {
  const candidates = [process.env.PLAYWRIGHT_PATH, 'playwright', 'C:/Users/JAC_PC/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'].filter(Boolean);
  for (const candidate of candidates) { try { return require(candidate); } catch { /* try the next one */ } }
  throw new Error('Playwright was not found. Install it with "npm install --no-save playwright" and "npx playwright install chromium", or set PLAYWRIGHT_PATH to an existing playwright folder.');
}
const { chromium } = loadPlaywright();
let browser;
try { browser = await chromium.launch({ headless:true, executablePath:process.env.PW_EXECUTABLE || undefined }); }
catch { browser = await chromium.launch({ headless:true, channel:'msedge' }); }
const context = await browser.newContext({ reducedMotion:'reduce' });
const page = await context.newPage();
page.setDefaultNavigationTimeout(60000);
const base = process.env.UI_TEST_BASE || 'http://127.0.0.1:4174';
const errors = [];
page.on('pageerror', (error) => errors.push(error.message));
page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
const output = 'artifacts/ui-check';
await mkdir(output, { recursive:true });
const focused = process.env.UI_TEST_FOCUSED === '1';
const checks = focused ? JSON.parse(await readFile(`${output}/results.json`,'utf8')).checks : [];
try {
  if (!focused) {
  for (const theme of ['light', 'dark']) {
    for (const width of [375,768,1024,1440]) {
      await page.setViewportSize({ width,height:900 });
      for (const route of ['/', '/dashboard','/upload','/results','/history','/reports','/analytics','/settings']) {
        await page.goto(`${base}${route}`, { waitUntil:'domcontentloaded' });
        await page.evaluate((value) => { localStorage.setItem('theme',value); document.documentElement.classList.toggle('dark',value === 'dark'); }, theme);
        await page.reload();
        await page.locator('h1').waitFor();
        await page.waitForTimeout(150);
        const layout = await page.evaluate(() => ({ width:innerWidth, scroll:document.documentElement.scrollWidth, heading:document.querySelector('h1')?.textContent }));
        assert.ok(layout.scroll <= width + 1, `${route} ${theme} ${width}: overflow ${layout.scroll}`);
        checks.push({ route,theme,width,...layout });
        if (width === 375 || width === 1440) await page.screenshot({ path:`${output}/${theme}-${width}-${route.slice(1) || 'login'}.png`,fullPage:true });
      }
    }
  }
  }
  await page.setViewportSize({ width:1440,height:900 });
  await page.goto(`${base}/settings`);
  await page.getByLabel('Hospital Name',{ exact:true }).fill('Demo Hospital');
  await page.getByRole('button',{name:'Save',exact:true}).click();
  assert.match(await page.getByRole('status').innerText(),/saved/);
  const themeBefore = await page.evaluate(() => localStorage.getItem('theme'));
  await page.getByLabel('Hospital Name',{exact:true}).fill('Unsaved edit');
  await page.getByRole('switch').click();
  assert.notEqual(await page.evaluate(() => localStorage.getItem('theme')),themeBefore);
  assert.equal(await page.getByLabel('Hospital Name',{exact:true}).inputValue(),'Unsaved edit');
  await page.reload();
  assert.equal(await page.getByLabel('Hospital Name',{exact:true}).inputValue(),'Demo Hospital');
  await page.goto(`${base}/history`);
  await page.getByRole('button',{name:'Next',exact:true}).click();
  assert.match(await page.locator('section').innerText(),/Page 2 of 2/);
  await page.getByLabel('Search patient history').fill('not-a-patient');
  assert.match(await page.locator('tbody').innerText(),/No matching/);
  await page.getByLabel('Search patient history').fill('');
  await page.getByRole('button',{name:'View',exact:true}).first().click();
  await page.getByRole('dialog').waitFor();
  await page.keyboard.press('Escape');
  await page.getByRole('dialog').waitFor({state:'hidden'});
  await page.goto(`${base}/upload`);
  await page.locator('input[type=file]').first().setInputFiles({name:'invalid.txt',mimeType:'text/plain',buffer:Buffer.from('invalid')});
  assert.match(await page.getByRole('alert').innerText(),/PNG, JPG, WebP or BMP/);
  await page.locator('input[type=file]').first().setInputFiles({name:'test.png',mimeType:'image/png',buffer:Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+j5WQAAAAASUVORK5CYII=','base64')});
  await page.getByLabel('Patient Name',{exact:true}).fill('Demo Patient');
  await page.getByLabel('Notes',{exact:true}).fill('Entered patient notes');
  await page.getByRole('button',{name:'Run demo analysis'}).click();
  await page.waitForURL('**/results');
  assert.match(await page.locator('main').innerText(),/Demo Patient/);
  assert.ok(await page.locator('.scan-viewer img').evaluate((image) => image.naturalWidth > 0));
  await page.getByLabel('Sample bounding box').check();
  await page.getByRole('button',{name:'Zoom in',exact:true}).click();
  assert.match(await page.locator('main').innerText(),/110%/);
  const popupPromise = context.waitForEvent('page');
  await page.getByRole('button',{name:'Print / save sample PDF'}).click();
  const popup = await popupPromise;
  assert.match(await popup.locator('body').innerText(),/Demonstration only/);
  assert.match(await popup.locator('body').innerText(),/Demo Patient/);
  assert.match(await popup.locator('body').innerText(),/Entered patient notes/);
  await popup.close();
  await page.setViewportSize({width:375,height:900});
  await page.getByRole('button',{name:'Open navigation',exact:true}).click();
  await page.getByRole('link',{name:'Patient History',exact:true}).click();
  await page.getByLabel('Search patients or reports').fill('Aaradhya');
  await page.getByLabel('Search patients or reports').press('Enter');
  assert.match(await page.locator('tbody').innerText(),/Aaradhya/);
  assert.deepEqual(errors,[]);
  await writeFile(`${output}/results.json`,JSON.stringify({ checks,errors,interactions:'settings persistence, shared theme, history pagination/search/dialog, file validation, upload navigation, overlay and zoom passed' },null,2));
  console.log(`PASS: ${focused ? 'Focused workflow confirmation; earlier' : ''} ${checks.length} route/theme/viewport checks and workflow interactions; no page or console errors.`);
} finally { await browser.close(); }
