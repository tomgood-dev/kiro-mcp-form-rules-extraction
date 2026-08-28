// Targeted probe: how are the Inflation Adjustment / Premium Freeze checkboxes wired on the
// Life cover card? AC03 (inflation auto-ticked) and AC21 (premium freeze unticks inflation)
// both need a reliable way to read/toggle these. Once found, the interaction is promoted into
// quote-helpers.js as a reusable helper so the generator never has to probe this again.
//
// SESSION HYGIENE PATTERN (template for all session-using scripts, incl. the automated generator):
//   1) preflightCleanup()  — start from zero active sessions (single-session dev env).
//   2) log in fresh.
//   3) do the work.
//   4) ALWAYS sign out + close in finally — never leak a session.
//
// Run: node apps/asteron-quote-apply/probes/probe-life-checkboxes.js
const { chromium } = require('@playwright/test');
const path = require('path');
const { preflightCleanup } = require('../../../tools/session-cleanup');

const BASE = process.env.BASE_URL || 'https://outsystems-dev.asteronlife.co.nz';
const EMAIL = process.env.ASTERON_LOGIN_EMAIL;
const PASSWORD = process.env.ASTERON_LOGIN_PASSWORD;

async function login(page) {
  await page.goto(BASE + '/CentralPortalsLogin/NewLoginRLANZ', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(4000);
  const email = page.locator('input[type="text"]').first();
  await email.click(); await page.keyboard.type(EMAIL, { delay: 30 });
  await page.locator('input[type="password"]').first().click(); await page.keyboard.type(PASSWORD, { delay: 30 });
  await page.locator('button:has-text("Log in")').click();
  for (let i = 0; i < 30; i++) { await page.waitForTimeout(1000); if (!page.url().includes('CentralPortalsLogin')) break; }
  if (page.url().includes('CentralPortalsLogin')) throw new Error('Login failed — still on login page (session conflict?).');
  console.log('[probe] logged in OK');
}

(async () => {
  if (!EMAIL || !PASSWORD) { console.error('[probe] set ASTERON_LOGIN_EMAIL / ASTERON_LOGIN_PASSWORD'); process.exit(1); }

  console.log('[probe] preflight cleanup (release any held session)...');
  preflightCleanup();
  await new Promise((r) => setTimeout(r, 3000));

  const browser = await chromium.launch({ channel: 'msedge', headless: false, slowMo: 40 });
  const context = await browser.newContext({ ignoreHTTPSErrors: true });
  const page = await context.newPage();
  page.setDefaultTimeout(30000);

  try {
    await login(page);

    console.log('[probe] opening quote...');
    await page.goto(BASE + '/QuoteAndApply/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);
    if (page.url().includes('Login') || page.url().includes('_error')) throw new Error('bounced to login/error opening quote (session?)');
    const quoteUrl = await page.evaluate(() => new Promise((resolve) => {
      window.open = (u) => resolve(u);
      const link = [...document.querySelectorAll('a')].find((a) => a.innerText.trim() === 'New Quote');
      if (link) link.click();
      setTimeout(() => resolve(null), 3000);
    }));
    if (quoteUrl) {
      console.log('[probe] captured quote url, navigating...');
      await page.goto(quoteUrl, { waitUntil: 'domcontentloaded' });
    } else {
      console.log('[probe] no New Quote link captured, using direct blank-quote URL...');
      await page.goto(BASE + '/QuoteAndApply/Quote?QuoteId=&ShowApplyNow=false&IsClone=false&LastModifiedDate=1900-01-01&ApplicationId=', { waitUntil: 'domcontentloaded' });
    }
    await page.waitForTimeout(5000);
    await page.locator('input[id*="Input_AgeNextBirthday"]').first().waitFor({ state: 'visible', timeout: 40000 });
    await page.waitForTimeout(1500);
    console.log('[probe] quote form rendered');

    // minimal personal details + activate Life
    const age = page.locator('input[id*="Input_AgeNextBirthday"]').first();
    await age.click(); await page.keyboard.press('Control+a'); await page.keyboard.press('Delete');
    await page.keyboard.type('35', { delay: 40 }); await page.keyboard.press('Tab'); await page.waitForTimeout(1500);
    await page.evaluate(() => { const b = [...document.querySelectorAll('.button-group-item')].find((x) => x.innerText.trim() === 'Male'); if (b) b.click(); });
    await page.waitForTimeout(1500);
    await page.evaluate(() => { const b = [...document.querySelectorAll('button')].find((x) => x.innerText.trim().split('\n')[0] === 'Life'); if (b) b.click(); });
    await page.waitForTimeout(3000);

    const checkboxes = await page.evaluate(() => {
      return [...document.querySelectorAll('input[type="checkbox"]')].map((c, i) => {
        const labelFor = c.id ? document.querySelector(`label[for="${c.id}"]`) : null;
        const closestLabel = c.closest('label');
        let container = c.parentElement; let containerText = '';
        for (let d = 0; d < 4 && container; d++) { containerText = (container.innerText || '').trim(); if (containerText) break; container = container.parentElement; }
        return {
          i, id: c.id || null, name: c.name || null, checked: c.checked, disabled: c.disabled,
          labelForText: labelFor ? labelFor.innerText.trim().slice(0, 60) : null,
          closestLabelText: closestLabel ? closestLabel.innerText.trim().slice(0, 60) : null,
          containerText: containerText.replace(/\s+/g, ' ').slice(0, 80),
          parentClass: c.parentElement ? (c.parentElement.className || '').toString().slice(0, 60) : null,
        };
      });
    });
    console.log('[probe] checkboxes found:', checkboxes.length);
    console.log(JSON.stringify(checkboxes, null, 2));

    // Dump all selects on the Life card so we find the real Premium Structure select ID
    // (guessing select[id*="PremiumStructure"] returned null — OutSystems IDs are non-obvious).
    const selects = await page.evaluate(() => {
      return [...document.querySelectorAll('select')].map((s, i) => {
        let container = s.parentElement; let containerText = '';
        for (let d = 0; d < 4 && container; d++) { containerText = (container.innerText || '').trim(); if (containerText) break; container = container.parentElement; }
        return {
          i, id: s.id || null, disabled: s.disabled,
          selected: s.options[s.selectedIndex] ? s.options[s.selectedIndex].text.trim() : null,
          options: [...s.options].map((o) => o.text.trim()).slice(0, 10),
          containerText: containerText.replace(/\s+/g, ' ').slice(0, 70),
        };
      });
    });
    console.log('[probe] selects found:', selects.length);
    console.log(JSON.stringify(selects, null, 2));

    const textHunt = await page.evaluate(() => {
      const out = {};
      ['Inflation', 'Premium Freeze', 'We Pay Your Premiums', 'Frequency'].forEach((term) => {
        const el = [...document.querySelectorAll('*')].find((e) => e.children.length === 0 && (e.innerText || '').trim().includes(term));
        if (!el) { out[term] = 'NOT FOUND'; return; }
        let node = el; let found = null;
        for (let d = 0; d < 6 && node && !found; d++) { found = node.querySelector('input[type="checkbox"], select'); node = node.parentElement; }
        out[term] = found ? { tag: found.tagName, type: found.type || null, id: found.id || null } : 'text present, no nearby control';
      });
      return out;
    });
    console.log('[probe] text hunt:', JSON.stringify(textHunt, null, 2));

  } finally {
    // GUARANTEED teardown — sign out then close, so we never leak a session.
    console.log('[probe] signing out + closing...');
    await page.locator('button:has-text("Sign out")').click({ timeout: 5000 }).catch(() => {});
    await page.waitForTimeout(2000);
    await browser.close().catch(() => {});
    console.log('[probe] closed cleanly.');
  }
})().catch((e) => { console.error('[probe] error:', e.message); process.exit(1); });
