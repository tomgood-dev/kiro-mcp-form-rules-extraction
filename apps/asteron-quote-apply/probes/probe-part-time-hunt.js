// Deeper probe for AC18 "part-time worker". Prior probe only read the DEFAULT screen state and
// concluded no part-time input exists — but part-time is a WORK PATTERN, orthogonal to
// Employment Status ("Employed"), and such a field may only REVEAL after Employment Status is
// set. This probe selects Employment Status = Employed (and tries each option), then dumps ALL
// selects + their options + all field labels, hunting for hours/basis/part-time/full-time.
//
// Run: node apps/asteron-quote-apply/probes/probe-part-time-hunt.js
const { chromium } = require('@playwright/test');
const { preflightCleanup } = require('../../../tools/session-cleanup');

const BASE = process.env.BASE_URL || 'https://outsystems-dev.asteronlife.co.nz';
const EMAIL = process.env.ASTERON_LOGIN_EMAIL;
const PASSWORD = process.env.ASTERON_LOGIN_PASSWORD;

async function login(page) {
  await page.goto(BASE + '/CentralPortalsLogin/NewLoginRLANZ', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(4000);
  await page.locator('input[type="text"]').first().click(); await page.keyboard.type(EMAIL, { delay: 30 });
  await page.locator('input[type="password"]').first().click(); await page.keyboard.type(PASSWORD, { delay: 30 });
  await page.locator('button:has-text("Log in")').click();
  for (let i = 0; i < 30; i++) { await page.waitForTimeout(1000); if (!page.url().includes('CentralPortalsLogin')) break; }
  if (page.url().includes('CentralPortalsLogin')) throw new Error('Login failed — still on login page.');
  console.log('[probe] logged in OK');
}

async function dumpControls(page, tag) {
  const data = await page.evaluate(() => {
    const selects = [...document.querySelectorAll('select')].map((s) => ({
      id: s.id, options: [...s.options].map((o) => o.text.trim()),
    }));
    // all field-ish labels
    const labels = [...document.querySelectorAll('label, legend, [class*="label"]')]
      .map((l) => (l.innerText || '').trim()).filter((t) => t && t.length < 60);
    const partTimeHits = [...document.querySelectorAll('*')]
      .filter((e) => e.children.length === 0 && /part[- ]?time|full[- ]?time|hours per week|work pattern|basis of/i.test(e.innerText || ''))
      .map((e) => e.innerText.trim().slice(0, 60)).slice(0, 8);
    return { selects, labels: [...new Set(labels)].slice(0, 40), partTimeHits };
  });
  console.log(`\n===== CONTROLS @ ${tag} =====`);
  console.log('selects:', JSON.stringify(data.selects, null, 2));
  console.log('labels:', JSON.stringify(data.labels));
  console.log('part/full-time hits:', JSON.stringify(data.partTimeHits));
}

(async () => {
  if (!EMAIL || !PASSWORD) { console.error('set creds'); process.exit(1); }
  preflightCleanup();
  await new Promise((r) => setTimeout(r, 3000));
  const browser = await chromium.launch({ channel: 'msedge', headless: false, slowMo: 40 });
  const page = await (await browser.newContext({ ignoreHTTPSErrors: true })).newPage();
  page.setDefaultTimeout(30000);
  try {
    await login(page);
    await page.goto(BASE + '/QuoteAndApply/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);
    const quoteUrl = await page.evaluate(() => new Promise((resolve) => {
      window.open = (u) => resolve(u);
      const link = [...document.querySelectorAll('a')].find((a) => a.innerText.trim() === 'New Quote');
      if (link) link.click(); setTimeout(() => resolve(null), 3000);
    }));
    if (quoteUrl) await page.goto(quoteUrl, { waitUntil: 'domcontentloaded' });
    else await page.goto(BASE + '/QuoteAndApply/Quote?QuoteId=&ShowApplyNow=false&IsClone=false&LastModifiedDate=1900-01-01&ApplicationId=', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(5000);
    await page.locator('input[id*="Input_AgeNextBirthday"]').first().waitFor({ state: 'visible', timeout: 40000 });
    await page.waitForTimeout(1500);
    console.log('[probe] quote form rendered');

    // Set a full persona first (age/gender/occ) so employment fields are enabled.
    const age = page.locator('input[id*="Input_AgeNextBirthday"]').first();
    await age.click(); await page.keyboard.press('Control+a'); await page.keyboard.press('Delete');
    await page.keyboard.type('19', { delay: 40 }); await page.keyboard.press('Tab'); await page.waitForTimeout(1500);
    await page.evaluate(() => { const b = [...document.querySelectorAll('.button-group-item')].find((x) => x.innerText.trim() === 'Male'); if (b) b.click(); });
    await page.waitForTimeout(1500);
    await page.locator('select[id*="OccupationCode_Dropdown"]').first().selectOption('1'); // AA
    await page.waitForTimeout(1500);

    await dumpControls(page, 'DEFAULT (Employment Status = Select one)');

    // Now try each Employment Status option and re-dump — a work-pattern/hours field may reveal.
    const empId = await page.evaluate(() => { const s = document.querySelector('select[id*="EmploymentStatus_Dropdown"]'); return s ? s.id : null; });
    for (const status of ['Employed', 'Self-Employed', 'Other']) {
      try {
        await page.locator(`[id="${empId}"]`).selectOption({ label: status });
        await page.waitForTimeout(2500);
        await dumpControls(page, `Employment Status = ${status}`);
      } catch (e) { console.log(`[probe] could not select ${status}: ${e.message}`); }
    }
  } finally {
    console.log('\n[probe] signing out + closing...');
    await page.locator('button:has-text("Sign out")').click({ timeout: 5000 }).catch(() => {});
    await page.waitForTimeout(2000);
    await browser.close().catch(() => {});
    console.log('[probe] closed cleanly.');
  }
})().catch((e) => { console.error('[probe] error:', e.message); process.exit(1); });
