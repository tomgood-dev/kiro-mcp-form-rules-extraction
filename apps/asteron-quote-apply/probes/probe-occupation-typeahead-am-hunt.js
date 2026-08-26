/**
 * Probe: hunt the "Occupation" type-ahead for an entry that resolves to Occupation
 * Code = AM (the plain select's raw code), then retest LSC-02/LSC-03 gating driven
 * through the type-ahead instead of the plain select — to test the hypothesis that
 * gating might only fire once the type-ahead field (not just the code) is populated.
 *
 * Phase 1: enumerate type-ahead options for a list of military/armed-forces-adjacent
 *          search terms (read-only, no selection, one fresh quote reused throughout).
 * Phase 2: for each unique option text found, select it on a fresh quote and record
 *          which Occupation Code it locks to.
 * Phase 3: for whichever code(s) were found (AM if found; otherwise the best
 *          substitute, e.g. U), retest Needlestick/Cancer gating driven via the
 *          type-ahead — WITHOUT clicking Apply, to avoid the earlier 500-error
 *          confound entirely.
 * Phase 4 (control): also test a plainly-civilian type-ahead entry expected to map to
 *          AA, to confirm type-ahead-driven selection behaves detectably the same way
 *          the plain select does when the code is one that should NOT be gated.
 */
const { chromium } = require('@playwright/test');
const path = require('path');
const {
  openNewQuote,
  setMinimumPersonalDetails,
  activateCover,
  removeAllCoverCards,
  waitForSettle,
} = require(path.join(__dirname, '..', 'helpers', 'quote-helpers'));

const SEARCH_TERMS = [
  'Armed Forces', 'Army', 'Navy', 'Air Force', 'Military', 'Soldier',
  'Defence', 'Defense', 'NZDF', 'Combat', 'Infantry', 'Marine',
];

async function countRemoveLinks(page) {
  return page.evaluate(() => [...document.querySelectorAll('a')].filter((a) => a.innerText.trim() === 'Remove').length);
}

async function openTypeahead(page) {
  await page.getByRole('combobox', { name: 'Select an option' }).click();
  const searchInput = page.locator('.vscomp-search-input');
  await searchInput.waitFor({ state: 'visible' });
  return searchInput;
}

async function listTypeaheadOptions(page, searchText) {
  const searchInput = await openTypeahead(page);
  await searchInput.fill(searchText);
  await page.waitForTimeout(600);
  const options = await page.locator('.vscomp-option').allInnerTexts();
  // Close the dropdown without selecting (Escape).
  await page.keyboard.press('Escape').catch(() => {});
  return options.map((o) => o.trim()).filter(Boolean);
}

async function selectTypeaheadOption(page, searchText, optionText) {
  const searchInput = await openTypeahead(page);
  await searchInput.fill(searchText);
  const option = page.locator('.vscomp-option').filter({ hasText: optionText }).first();
  await option.waitFor({ state: 'visible' });
  await option.click();
  await waitForSettle(page, 1500);
}

async function getOccupationCodeValue(page) {
  return page.evaluate(() => {
    const sel = document.querySelector('select[id*="OccupationCode_Dropdown"]');
    if (!sel) return null;
    const opt = [...sel.options].find((o) => o.value === sel.value);
    return { value: sel.value, text: opt ? opt.text.trim() : null, disabled: sel.disabled };
  });
}

(async () => {
  const email = process.env.ASTERON_LOGIN_EMAIL;
  const password = process.env.ASTERON_LOGIN_PASSWORD;
  if (!email || !password) throw new Error('Set ASTERON_LOGIN_EMAIL and ASTERON_LOGIN_PASSWORD env vars before running.');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ baseURL: 'https://outsystems-dev.asteronlife.co.nz', ignoreHTTPSErrors: true });
  const page = await context.newPage();
  page.setDefaultTimeout(30000);

  const mapping = []; // { searchText, optionText, occCode }
  const gatingResults = [];

  try {
    console.log('[login] Logging in...');
    await page.goto('https://outsystems-dev.asteronlife.co.nz/CentralPortalsLogin/NewLoginRLANZ', { waitUntil: 'domcontentloaded' });
    const form = page.locator('form.login-form');
    await form.locator('input[type="text"]').first().fill(email);
    await form.locator('input[type="password"]').first().fill(password);
    await form.locator('button[type="submit"]').first().click();
    await page.waitForURL('**/AdviserCentral_Uplift/**', { timeout: 60000 });
    console.log('[login] OK');

    // Phase 1: enumerate options per search term (read-only) on one fresh quote.
    let quote = await openNewQuote(page);
    await setMinimumPersonalDetails(quote);
    console.log('\n=== PHASE 1: enumerate type-ahead options ===');
    const uniqueOptions = new Map(); // optionText -> searchText that found it
    for (const term of SEARCH_TERMS) {
      const opts = await listTypeaheadOptions(quote, term);
      console.log(`  "${term}" -> ${JSON.stringify(opts)}`);
      for (const o of opts) if (!uniqueOptions.has(o)) uniqueOptions.set(o, term);
    }
    console.log(`\n[phase1] ${uniqueOptions.size} unique option(s) found across all search terms.`);

    // Phase 2: select each unique option on a fresh quote, record resulting Occupation Code.
    console.log('\n=== PHASE 2: map each option -> Occupation Code ===');
    for (const [optionText, searchText] of uniqueOptions) {
      quote = await openNewQuote(page);
      await setMinimumPersonalDetails(quote);
      try {
        await selectTypeaheadOption(quote, searchText, optionText);
        const code = await getOccupationCodeValue(quote);
        console.log(`  "${optionText}" -> Occupation Code = ${JSON.stringify(code)}`);
        mapping.push({ searchText, optionText, code });
      } catch (err) {
        console.log(`  "${optionText}" -> ERROR: ${err.message}`);
        mapping.push({ searchText, optionText, error: err.message });
      }
    }

    const amMatches = mapping.filter((m) => m.code && m.code.text === 'AM');
    const aaMatches = mapping.filter((m) => m.code && m.code.text === 'AA');
    console.log(`\n[phase2] AM matches: ${JSON.stringify(amMatches)}`);
    console.log(`[phase2] AA matches (for control test): ${JSON.stringify(aaMatches)}`);

    // Phase 3: gating retest via type-ahead, driven by whatever we found (AM preferred).
    const gatingTargets = [];
    if (amMatches.length) gatingTargets.push({ label: 'AM (found via type-ahead)', match: amMatches[0] });
    else {
      const uMatch = mapping.find((m) => m.code && m.code.text === 'U');
      if (uMatch) gatingTargets.push({ label: 'U (substitute — no AM type-ahead entry found)', match: uMatch });
    }
    if (aaMatches.length) gatingTargets.push({ label: 'AA (control — should NOT be gated)', match: aaMatches[0] });

    console.log('\n=== PHASE 3/4: gating retest via type-ahead (no Apply click) ===');
    for (const target of gatingTargets) {
      console.log(`\n--- Target: ${target.label} — selecting "${target.match.optionText}" via search "${target.match.searchText}" ---`);
      quote = await openNewQuote(page);
      await setMinimumPersonalDetails(quote);
      await selectTypeaheadOption(quote, target.match.searchText, target.match.optionText);
      const code = await getOccupationCodeValue(quote);
      console.log(`  Confirmed Occupation Code after type-ahead selection: ${JSON.stringify(code)}`);

      for (const cover of ['Needlestick', 'Cancer']) {
        const before = await countRemoveLinks(quote);
        let activated = null;
        let error = null;
        try {
          await activateCover(quote, cover);
          const after = await countRemoveLinks(quote);
          activated = after > before;
        } catch (err) {
          error = err.message;
        }
        console.log(`  ${cover}: ${error ? 'ERROR: ' + error : activated ? 'ACTIVATED (card added)' : 'no-op (gated)'}`);
        gatingResults.push({ target: target.label, occCode: code, cover, activated, error });
        await removeAllCoverCards(quote).catch(() => {});
      }
    }
  } catch (err) {
    console.error('FATAL: ' + err.message);
  } finally {
    console.log('\n=== FULL OPTION -> OCC CODE MAPPING ===');
    for (const m of mapping) {
      console.log(`${m.optionText} | search="${m.searchText}" | ${m.error ? 'ERROR: ' + m.error : JSON.stringify(m.code)}`);
    }
    console.log('\n=== GATING-VIA-TYPEAHEAD RESULTS ===');
    for (const r of gatingResults) {
      console.log(`${r.target} | code=${JSON.stringify(r.occCode)} | ${r.cover} | ${r.error ? 'ERROR: ' + r.error : r.activated ? 'ACTIVATED' : 'no-op'}`);
    }
    await page.locator('button:has-text("Sign out")').click().catch(() => {});
    await page.waitForTimeout(1000);
    await browser.close();
  }
})();
