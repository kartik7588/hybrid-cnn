import { createRequire } from 'node:module';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
import { parseDataset } from '../src/utils/dataset.js';
import { wdbcHeaders } from '../src/utils/wdbc.js';
const require = createRequire(import.meta.url);

// Settings (all optional):
//   BASE_URL         where the dev server is running (default http://127.0.0.1:5175)
//   LIVE_API=1       use the real Python server (python ml/api.py) instead of the built-in mock
//   PLAYWRIGHT_PATH  folder of an existing playwright install, if it is not in node_modules
//   PW_EXECUTABLE    path to a browser executable, if Playwright's own browser is not installed
const BASE_URL = process.env.BASE_URL || 'http://127.0.0.1:5175';
const LIVE_API = Boolean(process.env.LIVE_API);

function loadPlaywright() {
  const candidates = [process.env.PLAYWRIGHT_PATH, 'playwright', 'C:/Users/JAC_PC/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'].filter(Boolean);
  for (const candidate of candidates) { try { return require(candidate); } catch { /* try the next one */ } }
  throw new Error('Playwright was not found. Install it with "npm i -D playwright" and "npx playwright install chromium", or set PLAYWRIGHT_PATH to an existing playwright folder.');
}
const { chromium } = loadPlaywright();
let browser;
try { browser = await chromium.launch({headless:true,executablePath:process.env.PW_EXECUTABLE||undefined}); }
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

// Mock prediction server so this check does not need Python. The numbers are made up and only
// exercise the page. Use LIVE_API=1 to run the same workflow against the real server.
const features = wdbcHeaders.slice(2);
const mock = { offline: false };
if (!LIVE_API) {
  const names = { logistic_regression: 'Logistic Regression', svm: 'SVM', mlp: 'MLP' };
  const json = (route, body, status = 200) => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });
  const probability = (key, i) => ((i * 37 + key.length * 13) % 100) / 100;
  await page.route(url => new URL(url).pathname.startsWith('/api/'), route => {
    if (mock.offline) return route.abort('connectionrefused');
    const { pathname } = new URL(route.request().url());
    if (pathname === '/api/models') return json(route, { features, models: Object.entries(names).map(([key, name]) => ({ key, name, cutoff: 0.5 })), pairs: [] });
    if (pathname === '/api/metrics') {
      const row = selected => ({ selected, chosen_cutoff: { missed_cancers: 1, false_alarms: 1, sensitivity: 0.976, specificity: 0.986, accuracy: 0.982 } });
      return json(route, { n_test: 114, results: [row(['logistic_regression']), row(['svm']), row(['mlp']), row(['logistic_regression', 'svm']), row(['logistic_regression', 'mlp']), row(['svm', 'mlp'])] });
    }
    if (pathname === '/api/predict') {
      const { models, records } = route.request().postDataJSON();
      const each = Object.fromEntries(models.map(key => [key, records.map((_, i) => { const p = probability(key, i); return { probability: p, cutoff: 0.5, prediction: p >= 0.5 ? 'malignant' : 'benign' }; })]));
      const results = records.map((_, i) => {
        const p = models.reduce((sum, key) => sum + each[key][i].probability, 0) / models.length;
        const item = { index: i, probability: p, cutoff: 0.5, prediction: p >= 0.5 ? 'malignant' : 'benign' };
        if (models.length === 2) item.individual = Object.fromEntries(models.map(key => [key, each[key][i]]));
        return item;
      });
      return json(route, { models, results });
    }
    return json(route, { error: 'Not found.' }, 404);
  });
}

try {
  await page.goto(`${BASE_URL}/dataset`, { waitUntil: 'domcontentloaded' });
  await page.getByRole('heading',{name:'Upload dataset',exact:true}).waitFor();
  assert.equal(await page.getByRole('button',{name:'Run models'}).isDisabled(),true);
  await page.getByRole('button',{name:'Use sample dataset'}).click();
  await page.getByText(/357 benign and 212 malignant/).waitFor();
  await page.getByText(/trained on 455 of these 569 records/).waitFor();
  assert.equal(await page.getByLabel('Reference label column (optional)').inputValue(), 'diagnosis');
  const sampleDownloadPromise = page.waitForEvent('download');
  await page.getByRole('button',{name:'Download sample CSV'}).click();
  const sampleDownload = await sampleDownloadPromise;
  await sampleDownload.saveAs(`${out}/wisconsin-diagnostic.csv`);
  const sample = parseDataset(await readFile(`${out}/wisconsin-diagnostic.csv`, 'utf8'));
  assert.equal(sample.records.length, 569);
  assert.equal(sample.headers.length, 32);

  // Single model
  await page.getByRole('button',{name:'Run models'}).click();
  await page.getByRole('heading',{name:'Prediction output'}).waitFor();
  assert.match(await page.getByRole('status').innerText(),/569 rows across 1 model/);
  assert.equal(await page.locator('.dataset-workspace').getByText(/synthetic/i).count(),0);
  assert.equal(await page.getByLabel('Single model').locator('option',{hasText:'not trained yet'}).first().evaluate(option=>option.disabled),true);

  // Hybrid: any two trained models are combined
  await page.getByRole('radio',{name:'Hybrid model',exact:true}).check();
  assert.equal(await page.getByRole('heading',{name:'Prediction output'}).count(),0);
  await page.getByLabel('Model A').selectOption('lr');
  await page.getByLabel('Model B').selectOption('lr');
  await page.getByText('Choose two different models to combine.').waitFor();
  assert.equal(await page.getByRole('button',{name:'Run models'}).isDisabled(),true);
  await page.getByLabel('Model A').selectOption('mlp');
  await page.getByLabel('Model B').selectOption('svm');
  await page.getByRole('button',{name:'Run models'}).click();
  const summary = page.getByRole('region',{name:'Model summary table',exact:true});
  await summary.waitFor();
  assert.equal(await summary.getByText('MLP + SVM (combined)',{exact:true}).count(),1);
  assert.equal(await summary.getByText(/held-out patients/).count(),3);
  assert.match(await page.getByRole('status').innerText(),/569 rows across 3 models/);

  // Compare: trained models only
  await page.getByRole('radio',{name:'Compare models',exact:true}).check();
  assert.equal(await page.getByRole('checkbox',{name:/^CNN/}).isDisabled(),true);
  assert.equal(await page.getByRole('checkbox',{name:/^Hybrid CNN \+ MLP/}).isDisabled(),true);
  await page.getByRole('button',{name:'Run models'}).click();
  await page.getByRole('heading',{name:'Prediction output'}).waitFor();
  assert.match(await page.getByRole('status').innerText(),/569 rows across 3 models/);

  const dlPromise=page.waitForEvent('download');
  await page.getByRole('button',{name:'Export results CSV'}).click();
  const dl=await dlPromise;
  await dl.saveAs(`${out}/export.csv`);
  const exported = await readFile(`${out}/export.csv`,'utf8');
  assert.match(exported,/MODEL PREDICTIONS - research prototype/);
  assert.doesNotMatch(exported,/SYNTHETIC/);
  assert.equal(parseDataset(exported).records.length,569);
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
  assert.equal(await page.getByRole('heading',{name:'Prediction output'}).count(),0);
  await page.getByRole('button',{name:'Run models'}).click();
  await page.getByText('Page 1 of 57',{exact:true}).waitFor();
  await page.getByLabel('Choose CSV dataset').setInputFiles({name:'invalid.data',mimeType:'text/plain',buffer:Buffer.from('1,M,2')});
  await page.getByRole('alert').waitFor();
  await page.getByLabel('Choose CSV dataset').setInputFiles({name:'bad.csv',mimeType:'text/csv',buffer:Buffer.from('a,b\n1')});
  await page.getByRole('alert').waitFor();
  assert.equal(await page.getByRole('button',{name:'Run models'}).isDisabled(),true);
  await page.getByLabel('Choose CSV dataset').setInputFiles({name:'bad.zip',mimeType:'application/zip',buffer:Buffer.from('zip')});
  assert.match(await page.getByRole('alert').innerText(),/Choose a CSV/);

  // A valid CSV without the 30 feature columns is explained, not silently run
  await page.getByLabel('Choose CSV dataset').setInputFiles({name:'nofeatures.csv',mimeType:'text/csv',buffer:Buffer.from('id,value,label\ncase-1,1,Benign\n')});
  await page.getByText('nofeatures.csv',{exact:true}).waitFor();
  await page.getByRole('button',{name:'Run models'}).click();
  await page.getByText(/missing required feature columns: radius_mean/).waitFor();

  // Pagination with a CSV that has the feature columns
  const header=['id','label',...features].join(',');
  const rows=header+'\n'+Array.from({length:24},(_,i)=>[`case-${i}`,'Benign',...features.map(()=>i+1)].join(',')).join('\n');
  await page.getByLabel('Choose CSV dataset').setInputFiles({name:'many.csv',mimeType:'text/csv',buffer:Buffer.from(rows)});
  await page.getByRole('button',{name:'Run models'}).click();
  await page.getByRole('button',{name:'Next',exact:true}).click();
  await page.getByText('Page 2 of 3',{exact:true}).waitFor();
  assert.deepEqual(errors,[]);

  // Server not running: a clear message, and the run can be retried
  if (!LIVE_API) {
    mock.offline = true;
    await page.getByRole('button',{name:'Run models'}).click();
    await page.getByText(/Cannot reach the prediction server/).waitFor();
    assert.equal(await page.getByRole('button',{name:'Run models'}).isDisabled(),false);
    mock.offline = false;
    errors.length = 0;   // the blocked request is logged by the browser on purpose
  }

  // Compare needs at least two models
  for(const name of ['SVM','Logistic regression']) await page.getByRole('checkbox',{name,exact:true}).uncheck();
  await page.getByText('Choose at least two models to compare.').waitFor();
  assert.equal(await page.getByRole('button',{name:'Run models'}).isDisabled(),true);
  await page.getByRole('checkbox',{name:'MLP',exact:true}).uncheck();
  assert.equal(await page.getByRole('button',{name:'Run models'}).isDisabled(),true);
  await page.setViewportSize({width:375,height:900});
  await page.getByRole('button',{name:'Open navigation'}).click();
  const links=await page.locator('aside nav a').allTextContents();
  assert.equal(links.indexOf('Upload Dataset'),links.indexOf('Upload Scan')+1);
  await page.getByRole('link',{name:'Upload Scan',exact:true}).click();
  await page.getByRole('heading',{name:'Upload scan',exact:true}).waitFor();
  assert.deepEqual(errors,[]);
  await writeFile(`${out}/results.json`,JSON.stringify({api:LIVE_API?'live':'mocked',checks,errors,interactions:'Single, hybrid (any two models), three-model comparison, disabled untrained models, results export, invalid CSV, invalid type, missing feature columns, pagination, server-offline message, selection limits and mobile navigation passed.'},null,2));
  console.log(`PASS (${LIVE_API?'live API':'mocked API'}): eight viewport/theme checks and dataset workflows; no console/page errors.`);
} finally {await browser.close();}
