import { createRequire } from 'node:module';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
import { parseDataset } from '../src/utils/dataset.js';
const require = createRequire(import.meta.url);
const { chromium } = require('C:/Users/JAC_PC/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
let browser;
try { browser = await chromium.launch({headless:true}); }
catch { browser = await chromium.launch({headless:true,channel:'msedge'}); }
const context = await browser.newContext({reducedMotion:'reduce',acceptDownloads:true});
const page = await context.newPage();
page.setDefaultNavigationTimeout(90000);
page.setDefaultTimeout(30000);
const errors=[];
page.on('pageerror', e=>errors.push(e.message));
page.on('console', m=>{if(m.type()==='error') errors.push(m.text());});
const out='artifacts/dataset-check';
await mkdir(out,{recursive:true});
try {
  await page.goto('http://127.0.0.1:5175/dataset', { waitUntil: 'domcontentloaded' });
  await page.getByRole('heading',{name:'Upload dataset',exact:true}).waitFor();
  assert.equal(await page.getByRole('button',{name:'Run demo comparison'}).isDisabled(),true);
  await page.getByRole('button',{name:'Use sample dataset'}).click();
  await page.getByText(/357 benign and 212 malignant/).waitFor();
  assert.equal(await page.getByLabel('Reference label column (optional)').inputValue(), 'diagnosis');
  const sampleDownloadPromise = page.waitForEvent('download');
  await page.getByRole('button',{name:'Download sample CSV'}).click();
  const sampleDownload = await sampleDownloadPromise;
  await sampleDownload.saveAs(`${out}/wisconsin-diagnostic.csv`);
  const sample = parseDataset(await readFile(`${out}/wisconsin-diagnostic.csv`, 'utf8'));
  assert.equal(sample.records.length, 569);
  assert.equal(sample.headers.length, 32);
  await page.getByRole('button',{name:'Run demo comparison'}).click();
  await page.getByRole('heading',{name:'Synthetic comparison output'}).waitFor();
  assert.match(await page.getByRole('status').innerText(),/569 rows across 1 model/);
  await page.getByRole('radio',{name:'Hybrid model',exact:true}).check();
  assert.equal(await page.getByRole('heading',{name:'Synthetic comparison output'}).count(),0);
  await page.getByRole('button',{name:'Run demo comparison'}).click();
  assert.equal(await page.getByRole('region',{name:'Model summary table',exact:true}).getByText('Hybrid CNN + MLP',{exact:true}).count(),1);
  await page.getByRole('radio',{name:'Compare models',exact:true}).check();
  await page.getByRole('button',{name:'Run demo comparison'}).click();
  assert.match(await page.getByRole('status').innerText(),/569 rows across 5 models/);
  const dlPromise=page.waitForEvent('download');
  await page.getByRole('button',{name:'Export demo CSV'}).click();
  const dl=await dlPromise;
  await dl.saveAs(`${out}/export.csv`);
  assert.match(await readFile(`${out}/export.csv`,'utf8'),/SYNTHETIC DEMO - NO MODEL INFERENCE/);
  const checks=[];
  for(const theme of ['light','dark']) {
    await page.evaluate(t=>{document.documentElement.classList.toggle('dark',t==='dark');localStorage.setItem('theme',t);},theme);
    for(const width of [375,768,1024,1440]) {
      await page.setViewportSize({width,height:900});
      await page.evaluate(()=>window.scrollTo(0,0));
      const dimensions=await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth}));
      assert.ok(dimensions.scroll<=width+1,`${theme} ${width}: overflow ${dimensions.scroll}`);
      await page.screenshot({path:`${out}/${theme}-${width}.png`,fullPage:true});
      checks.push({theme,width,...dimensions});
    }
  }
  await page.getByLabel('Choose CSV dataset').setInputFiles('src/data/wdbc.data');
  await page.getByText(/357 benign and 212 malignant/).waitFor();
  assert.equal(await page.getByRole('heading',{name:'Synthetic comparison output'}).count(),0);
  await page.getByRole('button',{name:'Run demo comparison'}).click();
  await page.getByText('Page 1 of 57',{exact:true}).waitFor();
  await page.getByLabel('Choose CSV dataset').setInputFiles({name:'invalid.data',mimeType:'text/plain',buffer:Buffer.from('1,M,2')});
  await page.getByRole('alert').waitFor();
  await page.getByLabel('Choose CSV dataset').setInputFiles({name:'bad.csv',mimeType:'text/csv',buffer:Buffer.from('a,b\n1')});
  await page.getByRole('alert').waitFor();
  assert.equal(await page.getByRole('button',{name:'Run demo comparison'}).isDisabled(),true);
  await page.getByLabel('Choose CSV dataset').setInputFiles({name:'bad.zip',mimeType:'application/zip',buffer:Buffer.from('zip')});
  assert.match(await page.getByRole('alert').innerText(),/Choose a CSV/);
  const rows='id,value,label\n'+Array.from({length:24},(_,i)=>`case-${i},${i},Benign`).join('\n');
  await page.getByLabel('Choose CSV dataset').setInputFiles({name:'many.csv',mimeType:'text/csv',buffer:Buffer.from(rows)});
  await page.getByRole('button',{name:'Run demo comparison'}).click();
  await page.getByRole('button',{name:'Next',exact:true}).click();
  await page.getByText('Page 2 of 3',{exact:true}).waitFor();
  for(const name of ['SVM','Logistic regression','CNN','MLP','Hybrid CNN + MLP']) await page.getByRole('checkbox',{name,exact:true}).uncheck();
  assert.equal(await page.getByRole('button',{name:'Run demo comparison'}).isDisabled(),true);
  await page.setViewportSize({width:375,height:900});
  await page.getByRole('button',{name:'Open navigation'}).click();
  const links=await page.locator('aside nav a').allTextContents();
  assert.equal(links.indexOf('Upload Dataset'),links.indexOf('Upload Scan')+1);
  await page.getByRole('link',{name:'Upload Scan',exact:true}).click();
  await page.getByRole('heading',{name:'Upload scan',exact:true}).waitFor();
  assert.deepEqual(errors,[]);
  await writeFile(`${out}/results.json`,JSON.stringify({checks,errors,interactions:'Single, hybrid, five-model comparison, export, invalid CSV, invalid type, replacement, pagination, empty selection and mobile navigation passed.'},null,2));
  console.log('PASS: eight viewport/theme checks and dataset workflows; no console/page errors.');
} finally {await browser.close();}
