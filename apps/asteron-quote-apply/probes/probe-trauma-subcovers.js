// Consolidated probe for the remaining Trauma ACs (ACB-2926):
//   AC04 — Major Trauma sub-cover: SI field + Premium Structure (should mirror Trauma)
//   AC05 — TPD on Trauma sub-cover: SI, Premium Structure, Definition dropdown {Own default, Any}
//   AC20 — Trauma Reinstatement vs Continuous Trauma checkboxes (mutual exclusion) — find selectors
//   AC24 — tooltip "?" icons and their mechanism
//   AC27 — TPD on Trauma Definition options (for the Modified-TPD 17-21 eligibility rule)
//
// Run: node apps/asteron-quote-apply/probes/probe-trauma-subcovers.js
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

async function dumpState(page, tag) {
  const data = await page.evaluate(() => {
    const checkboxes = [...document.querySelectorAll('input[type="checkbox"]')].map((c) => {
      let cont = c.parentElement, txt = '';
      for (let d = 0; d < 4 && cont; d++) { txt = (cont.innerText || '').trim(); if (txt) break; cont = cont.parentElement; }
      return { id: c.id, checked: c.checked, disabled: c.disabled, near: txt.replace(/\s+/g, ' ').slice(0, 50) };
    });
    const selects = [...document.querySelectorAll('select')].map((s) => ({
      id: s.id, selected: s.options[s.selectedIndex] ? s.options[s.selectedIndex].text.trim() : null,
      options: [...s.options].map((o) => o.text.trim()),
    }));
    const siCount = document.querySelectorAll('input[id*="SumInsured"]').length;
    const tooltips = [...document.querySelectorAll('[class*="tooltip"], [aria-label*="?"], [title], .info-icon, [class*="help"]')].length;
    return { checkboxes, selects, siCount, tooltips };
  });
  console.log(`\n===== ${tag} =====`);
  console.log('SumInsured inputs on page:', data.siCount, '| tooltip-ish elements:', data.tooltips);
  console.log('checkboxes:', JSON.stringify(data.checkboxes, null, 2));
  console.log('selects:', JSON.stringify(data.selects.filter((s) => !/Occupation|Employment|Premiums|FlexiRate|Kids|Dropdown1$/.test(s.id) || /Own|Any|Stepped|Level/.test((s.options || []).join(','))), null, 2));
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

    // persona + activate Trauma
    const age = page.locator('input[id*="Input_AgeNextBirthday"]').first();
    await age.click(); await page.keyboard.press('Control+a'); await page.keyboard.press('Delete');
    await page.keyboard.type('40', { delay: 40 }); await page.keyboard.press('Tab'); await page.waitForTimeout(1500);
    await page.evaluate(() => { const b = [...document.querySelectorAll('.button-group-item')].find((x) => x.innerText.trim() === 'Male'); if (b) b.click(); });
    await page.waitForTimeout(1500);
    await page.locator('select[id*="OccupationCode_Dropdown"]').first().selectOption('1');
    await page.waitForTimeout(1500);
    await page.evaluate(() => { const b = [...document.querySelectorAll('button')].find((x) => x.innerText.trim().split('\n')[0] === 'Trauma'); if (b) b.click(); });
    await page.waitForTimeout(3000);

    await dumpState(page, 'AFTER Trauma activated (AC03/AC20/AC24: checkboxes, structure, tooltips)');

    // Activate Major Trauma sub-cover (AC04)
    await page.evaluate(() => { const b = [...document.querySelectorAll('button')].find((x) => x.innerText.trim().split('\n')[0] === 'Major Trauma'); if (b) b.click(); });
    await page.waitForTimeout(3000);
    await dumpState(page, 'AFTER Major Trauma activated (AC04: SI + structure)');

    // Activate TPD on Trauma sub-cover (AC05/AC27 — Definition dropdown)
    await page.evaluate(() => { const b = [...document.querySelectorAll('button')].find((x) => x.innerText.trim().split('\n')[0] === 'TPD on Trauma'); if (b) b.click(); });
    await page.waitForTimeout(3000);
    await dumpState(page, 'AFTER TPD on Trauma activated (AC05/AC27: Definition {Own/Any}, SI, structure)');
  } finally {
    console.log('\n[probe] signing out + closing...');
    await page.locator('button:has-text("Sign out")').click({ timeout: 5000 }).catch(() => {});
    await page.waitForTimeout(2000);
    await browser.close().catch(() => {});
    console.log('[probe] closed cleanly.');
  }
})().catch((e) => { console.error('[probe] error:', e.message); process.exit(1); });
