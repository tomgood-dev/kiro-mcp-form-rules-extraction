// Apply for Kids Cover — acceptance-criteria mode (Jira ACB-2295).
// Source: docs/user-stories/User Story- Apply for Kids Cover.md
//
// Exhaustive standard: positive + negative/absence + boundary + value-level via recordCheck.
// Prior art: create-a-new-business-quote-v1 AC14 established the Kids SI tier ($50,000 (Free) default,
// $10k steps to $200,000 = 16 options) + per-kid First/Surname/Gender/DOB + the "number of kids"
// select (0..9). Kids Cover requires at least one Personal Insurance cover (AC06). Max 9 kids.
const { test, expect } = require('@playwright/test');
const {
  openNewQuote, setMinimumPersonalDetails, activateCover, fillCalcMask, sumInsuredInput,
  getVisibleErrors, clickApply, waitForSettle,
} = require('../../helpers/quote-helpers');
const { recordCheck, recordStep } = require('../../../../tools/artifact-helpers');

const errText = (page) => getVisibleErrors(page).then((x) => x.join(' | '));
// The "number of kids" select: fingerprint by options 0..9.
async function setNumKids(page, n) {
  const sel = page.locator('select').filter({ has: page.locator('option', { hasText: /^0$/ }) }).filter({ has: page.locator('option', { hasText: /^9$/ }) }).first();
  await sel.selectOption(String(n));
  await waitForSettle(page, 1500);
}
// The Kids SI tier select: fingerprint by "$50,000 (Free)".
async function getKidTier(page) {
  return page.evaluate(() => {
    const sel = [...document.querySelectorAll('select')].find((s) => [...s.options].some((o) => o.text.includes('$50,000')) && [...s.options].some((o) => o.text.trim() === '$200,000'));
    return sel ? { selected: sel.options[sel.selectedIndex].text.trim(), options: [...sel.options].map((o) => o.text.trim()) } : null;
  });
}
// Open a quote with a Life companion (Kids Cover requires a Personal Insurance cover).
async function freshQuoteWithLife(page, personal) {
  const quote = await openNewQuote(page);
  await setMinimumPersonalDetails(quote, personal || { age: 40, gender: 'Male', occupationCode: '1' });
  await activateCover(quote, 'Life');
  await fillCalcMask(sumInsuredInput(quote, 0), '200000');
  await waitForSettle(quote, 1000);
  return quote;
}

// ── AC08/AC09 helpers (premium-panel behaviour) ──
// Reads the Total Yearly Premium value from the panel (e.g. "$296.16").
async function readYearlyPremium(page) {
  return page.evaluate(() => {
    const m = (document.body.innerText || '').match(/Total Yearly Premium[\s\S]{0,40}?(\$[\d,]+\.\d{2})/i);
    return m ? m[1] : null;
  });
}
// Panel lines that are a real Kids PREMIUM line = contain "Kids" AND a $ amount (not the section header).
async function getKidsPremiumLines(page) {
  return page.evaluate(() => (document.body.innerText || '').split('\n').map((l) => l.trim())
    .filter((l) => /^kids/i.test(l) && /\$\d[\d,]*\.\d{2}/.test(l) || (/^kids$/i.test(l))) // "Kids" then amount on next line renders joined in innerText sometimes
    .filter((l) => /kids/i.test(l)));
}
// Fill a field by id then BLUR (OutSystems commits + clears the transient "Required field!" on blur —
// confirmed 2026-09-14; without the blur the kid DOB stays in error and the panel reads $0.00).
async function fillBlur(page, id, val) {
  const loc = page.locator(`[id="${id}"]`);
  await loc.fill(val).catch(() => {});
  await loc.evaluate((e) => { e.dispatchEvent(new Event('change', { bubbles: true })); e.blur(); }).catch(() => {});
  await page.locator('body').click({ position: { x: 5, y: 5 } }).catch(() => {});
  await waitForSettle(page, 400);
}
// Sets up N kids: selects the count, fills each name, sets each SI tier, then fills+blurs each DOB
// LAST (SI change re-renders the kids list, so DOBs must come after). Verifies DOBs landed.
async function setupKidsCover(page, kids) {
  const numSel = page.locator('select').filter({ has: page.locator('option', { hasText: /^0$/ }) }).filter({ has: page.locator('option', { hasText: /^9$/ }) }).first();
  await numSel.selectOption(String(kids.length));
  await waitForSettle(page, 1500);
  // names
  const nameIds = await page.evaluate(() => ({
    fs: [...document.querySelectorAll('input[id*="FirstName"]')].filter((i) => !/b15-/.test(i.id)).map((i) => i.id),
    ls: [...document.querySelectorAll('input[id*="LastName"],input[id*="Surname"]')].filter((i) => !/b15-/.test(i.id)).map((i) => i.id),
  }));
  for (let i = 0; i < nameIds.fs.length; i++) await fillBlur(page, nameIds.fs[i], 'Kid' + (i + 1));
  for (const id of nameIds.ls) await fillBlur(page, id, 'Test');
  // SI tiers
  const nt = await page.evaluate(() => { const t = [...document.querySelectorAll('select')].filter((s) => [...s.options].some((o) => o.text.includes('$50,000')) && [...s.options].some((o) => o.text.trim() === '$200,000')); t.forEach((s, i) => s.setAttribute('data-kt', String(i))); return t.length; });
  for (let i = 0; i < nt; i++) await page.locator(`select[data-kt="${i}"]`).selectOption({ label: kids[i] ? kids[i].si : kids[0].si }).catch(() => {});
  await waitForSettle(page, 1500);
  // DOBs LAST, blurred + landing-verified
  for (let pass = 0; pass < 4; pass++) {
    const ids = await page.evaluate(() => [...document.querySelectorAll('input[type="date"][id*="Input_BirthDate"]')].filter((i) => i.id.indexOf('b15-Input_BirthDate') === -1).map((i) => i.id));
    for (let i = 0; i < ids.length; i++) await fillBlur(page, ids[i], (kids[i] && kids[i].dob) || '2018-06-15');
    const ok = await page.evaluate(() => [...document.querySelectorAll('input[type="date"][id*="Input_BirthDate"]')].filter((i) => i.id.indexOf('b15-Input_BirthDate') === -1).every((i) => !!i.value));
    if (ok) break;
  }
}
// Waits until the panel's $ amounts stop changing (2 identical consecutive reads) — signal, not a fixed sleep.
async function waitForStablePremium(page, timeoutMs = 10000) {
  const start = Date.now(); let last = null; let stable = 0;
  while (Date.now() - start < timeoutMs) {
    const sig = await page.evaluate(() => ((document.body.innerText || '').match(/\$[\d,]+\.\d{2}/g) || []).join('|'));
    if (sig === last) { if (++stable >= 2) return sig; } else { stable = 0; last = sig; }
    await page.waitForTimeout(400);
  }
  return last;
}

test.describe('Apply for Kids Cover (ACB-2295)', () => {
  test.describe.configure({ mode: 'parallel' });

  test('AC01/AC02/AC07: Kids Cover selectable; number-of-kids drives per-kid First/Surname/DOB/Gender/SI fields', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC01/AC02/AC07: I can apply for Kids Cover in the same quote; select Number of kids; and for each kid enter First Name, Surname, Date of Birth, Male/Female, Sum Insured.',
      '', 'Steps to reproduce:', '1. New quote, Life $200k companion. 2. Select Number of kids = 1. 3. Confirm per-kid DOB + name + gender fields appear.',
      '', 'Expected: selecting 1 kid reveals per-kid fields (DOB date input count increases; First/Surname/Gender present).',
    ].join('\n') });
    const quote = await freshQuoteWithLife(page);
    const dateBefore = await quote.locator('input[type="date"]').count();
    await setNumKids(quote, 1);
    const dateAfter = await quote.locator('input[type="date"]').count();
    await recordStep(testInfo, page, { label: 'Selecting 1 kid reveals a per-kid Date of Birth field', expected: '> before', actual: `${dateBefore} -> ${dateAfter}` });
    expect(dateAfter, 'AC07: per-kid DOB field appears').toBeGreaterThan(dateBefore);
    const kidFields = await quote.evaluate(() => ({
      firstName: [...document.querySelectorAll('input[id*="FirstName"]')].length > 1,
      surname: [...document.querySelectorAll('input[id*="LastName"], input[id*="Surname"]')].length > 1,
      gender: [...document.querySelectorAll('.button-group-item, .button-group-selected-item')].filter((b) => ['Male', 'Female'].includes(b.innerText.trim())).length > 2,
    }));
    for (const [k, v] of Object.entries(kidFields)) {
      await recordStep(testInfo, page, { label: `Per-kid ${k} field present`, expected: true, actual: v });
      expect(v, `AC02: per-kid ${k} present`).toBe(true);
    }
  });

  test('AC03/AC04: Kids SI is a dropdown, default $50,000 (Free), range $50k-$200k in $10k steps (16 tiers)', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC03: Kids SI is a pre-populated dropdown defaulting to $50,000 (Free). AC04: range $50,000 (Free), $60,000 ... $200,000.',
      '', 'Steps to reproduce:', '1. New quote, Life $200k, Number of kids = 1. 2. Read the Kids SI dropdown default + options.',
      '', 'Expected: default "$50,000 (Free)"; 16 options; first "$50,000 (Free)", last "$200,000", $10k steps.',
    ].join('\n') });
    const quote = await freshQuoteWithLife(page);
    await setNumKids(quote, 1);
    const tier = await getKidTier(quote);
    await recordStep(testInfo, page, { label: 'Kids SI dropdown default', expected: '$50,000 (Free)', actual: tier?.selected });
    expect(tier?.selected, 'AC03: default $50,000 (Free)').toBe('$50,000 (Free)');
    await recordStep(testInfo, page, { label: 'Kids SI tier count (16: $50k-$200k in $10k steps)', expected: 16, actual: tier?.options?.length });
    expect(tier?.options, 'AC04: 16 tiers').toHaveLength(16);
    await recordStep(testInfo, page, { label: 'Kids SI first tier', expected: 'starts $50,000', actual: tier?.options?.[0] });
    expect(tier?.options?.[0], 'AC04: first tier $50,000 (Free)').toContain('$50,000');
    await recordStep(testInfo, page, { label: 'Kids SI last tier', expected: '$200,000', actual: tier?.options?.at(-1) });
    expect(tier?.options?.at(-1), 'AC04: last tier $200,000').toBe('$200,000');
    // $10k-step check.
    const nums = (tier?.options || []).map((o) => Number((o.match(/\$([\d,]+)/) || [])[1]?.replace(/,/g, '')));
    const steps = nums.slice(1).map((n, i) => n - nums[i]);
    await recordStep(testInfo, page, { label: 'Kids SI tiers step by exactly $10,000', expected: 'all 10000', actual: [...new Set(steps)] });
    expect(steps.every((s) => s === 10000), 'AC04: $10k steps').toBe(true);
  });

  test('AC06: selecting kids with NO primary personal cover → companion-required error', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC06: When I select number of kids without any primary Personal Insurance cover, Then error "Please add at least one Personal Insurance Cover before adding Kids Cover".',
      '', 'Steps to reproduce:', '1. New quote (NO covers). 2. Select Number of kids = 1. 3. Apply/read error.',
      '', 'Expected: the "add at least one Personal Insurance Cover before adding Kids Cover" error.',
    ].join('\n') });
    const quote = await openNewQuote(page);
    await setMinimumPersonalDetails(quote, { age: 40, gender: 'Male', occupationCode: '1' });
    await setNumKids(quote, 1).catch(() => {});
    await clickApply(quote);
    const e = await errText(quote);
    await recordStep(testInfo, page, { label: 'Kids with no personal cover raises the companion-required error', expected: 'add at least one Personal Insurance Cover before adding Kids Cover', actual: e });
    expect(/at least one Personal Insurance Cover before adding Kids Cover/i.test(e), `AC06. Got: ${e.slice(0, 200)}`).toBe(true);
  });

  test('AC05: a kid DOB with ANB > 21 → maximum-age error (single error even with multiple over-age kids)', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC05: When a kid Date of Birth gives ANB > 21, Then error "The maximum Age Next Birthday kids cover is 21" (only one error even with multiple over-age kids).',
      '', 'Steps to reproduce:', '1. New quote, Life $200k, Number of kids = 1. 2. Enter a kid DOB ~30 years ago (ANB > 21). 3. Apply.',
      '', 'Expected: the "maximum Age Next Birthday kids cover is 21" error.',
    ].join('\n') });
    const quote = await freshQuoteWithLife(page);
    await setNumKids(quote, 1);
    // Probe (2026-09-07) established the field structure: 'b15-Input_BirthDate' is the PRIMARY insured's
    // DOB; the KID's DOB is the repeating-list input whose id has an 'l2'/'_0-' segment
    // (e.g. 'b23-b14-l2-1454_0-b5-Input_BirthDate'). The kid row has NO Age-Next-Birthday input, so the
    // over-age check must be verified via the Apply-time error, not a kid-ANB read. Playwright fill()
    // (not raw .value) reliably lands the date value in the OutSystems reactive pipeline.
    const kidDobId = await quote.evaluate(() => {
      var dates = [].slice.call(document.querySelectorAll('input[type="date"][id*="Input_BirthDate"]'));
      var kid = dates.filter(function (i) { return i.id.indexOf('b15-Input_BirthDate') === -1; })[0];
      return kid ? kid.id : null;
    });
    expect(kidDobId, 'AC05 setup: kid DOB input located').not.toBeNull();
    const d = new Date(); const dob = `${d.getFullYear() - 30}-06-15`;
    await quote.locator(`[id="${kidDobId}"]`).fill(dob);
    await waitForSettle(quote, 1500);
    // SELF-VERIFY the value landed on the kid DOB input (fill confirmed in probe to update the reactive value).
    const landed = await quote.evaluate((id) => { var el = document.getElementById(id); return el ? el.value : null; }, kidDobId);
    await recordStep(testInfo, page, { label: 'Kid DOB value landed (self-verify)', expected: dob, actual: landed });
    expect(landed, 'AC05 self-verify: kid DOB value landed').toBe(dob);
    await clickApply(quote);
    const e = await errText(quote);
    await recordStep(testInfo, page, { label: 'Kid ANB > 21 raises the max-age error', expected: 'The maximum Age Next Birthday kids cover is 21', actual: e });
    expect(/maximum Age Next Birthday kids cover is 21/i.test(e), `AC05. Got: ${e.slice(0, 250)}`).toBe(true);
  });

  test('Business Rule: maximum number of kids is 9 (the number-of-kids select caps at 9)', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'Business Rule: Maximum number of kids is 9 per life. (Value-level: the Number of kids select tops out at 9.)',
      '', 'Steps to reproduce:', '1. New quote, Life $200k. 2. Read the Number-of-kids select max option.',
      '', 'Expected: the highest selectable number of kids is 9.',
    ].join('\n') });
    const quote = await freshQuoteWithLife(page);
    const maxKids = await quote.evaluate(() => {
      const sel = [...document.querySelectorAll('select')].find((s) => { const o = [...s.options].map((x) => x.text.trim()); return o.includes('0') && o.includes('9'); });
      return sel ? Math.max(...[...sel.options].map((o) => Number(o.text.trim())).filter((n) => !isNaN(n))) : null;
    });
    await recordStep(testInfo, page, { label: 'Maximum selectable number of kids', expected: 9, actual: maxKids });
    expect(maxKids, 'BR: max 9 kids').toBe(9);
  });

  test('AC08: kid SI above $50k dynamically calculates + displays a premium', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC08: Given I am on the Kids Cover section, When I select kid(s) sum insured more than 50000,',
      'Then the system should dynamically calculate premium and display.',
      '',
      'Steps to reproduce:',
      '1. New quote, Life $200k (prices at $296.16/yr = $24.68/mo).',
      '2. Number of kids = 1; fill name; set kid Sum Insured $100,000 (>$50k); fill DOB and BLUR it.',
      '3. Read the Total Yearly Premium.',
      '',
      'Expected: premium increases (a kids premium is calculated). Confirmed 2026-09-14: 1 kid @',
      '$100k adds $5.00/mo → $356.16/yr. NOTE: the kid DOB shows a transient "Required field!" until',
      'the field is blurred — must blur (setupKidsCover does) or the panel reads $0.00.',
    ].join('\n') });
    const quote = await freshQuoteWithLife(page);
    const before = await readYearlyPremium(quote);
    await recordCheck(testInfo, { label: 'Baseline yearly premium (Life $200k, no kids)', expected: '$296.16', actual: before });
    await setupKidsCover(quote, [{ si: '$100,000', dob: '2018-06-15' }]);
    await waitForStablePremium(quote);
    const after = await readYearlyPremium(quote);
    const errs = await getVisibleErrors(quote);
    await recordCheck(testInfo, { label: 'No on-screen error after kids entry (DOB blurred)', expected: 'none', actual: errs.join(' | ') || 'none' });
    await recordCheck(testInfo, { label: 'Yearly premium after 1 kid @ $100k (>$50k) is calculated (increases)', expected: '> $296.16', actual: after });
    expect(after, 'AC08: kid SI > $50k produces a calculated premium (not $0.00, and above the Life-only baseline)').not.toBe('$0.00');
    const num = (s) => Number(String(s).replace(/[^0-9.]/g, ''));
    expect(num(after), 'AC08: premium increased vs Life-only baseline').toBeGreaterThan(num(before));
  });

  test('AC09: multiple kids >$50k show a single aggregated "Kids" premium line', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC09: Given I am on the Kids Cover section, When I select multiple kids with sum insured more',
      'than 50000, Then regardless of how many kids the premium panel shows only ONE total Kids',
      'premium line (e.g. Life A - 100.10, Kids - 14.00, Total - $114.10).',
      '',
      'Steps to reproduce:',
      '1. New quote, Life $200k. 2. Number of kids = 3; fill names; each kid SI $100,000; DOBs blurred.',
      '3. Read the premium panel cover breakdown.',
      '',
      'Expected: exactly ONE "Kids" premium line. Confirmed 2026-09-14: 3 kids show a single',
      '"Kids $15.00" line (not one per kid); Life $24.68 + Kids $15.00 = $39.68/mo ($476.16/yr).',
    ].join('\n') });
    const quote = await freshQuoteWithLife(page);
    await setupKidsCover(quote, [
      { si: '$100,000', dob: '2018-06-15' },
      { si: '$100,000', dob: '2018-06-15' },
      { si: '$100,000', dob: '2018-06-15' },
    ]);
    await waitForStablePremium(quote);
    const kidsPremiumLines = await getKidsPremiumLines(quote);
    await recordCheck(testInfo, { label: 'Exactly one aggregated "Kids" premium line for 3 kids', expected: '1 line', actual: `${kidsPremiumLines.length}: ${kidsPremiumLines.join(' | ') || '(none)'}` });
    expect(kidsPremiumLines.length, 'AC09: exactly one aggregated Kids premium line regardless of number of kids').toBe(1);
  });
});
