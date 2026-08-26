// Helpers for the "Adviser Use" commission modal (Default for Agency, Select IC/RC,
// per-cover commission category, Update button). Builds on quote-helpers.js /
// outsystems-generic-helpers.js for everything up to opening the modal itself.
const { waitForSettle } = require('./outsystems-generic-helpers');

/** Opens the "Adviser Use" modal on a priced quote. */
async function openAdviserUse(page) {
  await page.evaluate(() => {
    const el = [...document.querySelectorAll('button, a')].find((e) => e.innerText && e.innerText.trim().includes('Adviser Use'));
    if (!el) throw new Error('Adviser Use button not found');
    if (el.disabled) throw new Error('Adviser Use button is disabled');
    el.click();
  });
  await waitForSettle(page, 1500);
}

/** Closes the "Adviser Use" modal via its Close button. */
async function closeAdviserUse(page) {
  await page.evaluate(() => {
    const b = [...document.querySelectorAll('button')].find((x) => x.innerText.trim() === 'Close');
    if (b) b.click();
  });
  await waitForSettle(page, 1000);
}

/** Sets the quote-level Flexi Rate (e.g. '2.5%', '30.0%'). */
async function setFlexiRate(page, label) {
  await page.locator('select[id*="FlexiRate"]').first().selectOption({ label });
  await waitForSettle(page, 2000);
}

/**
 * Fingerprint: the ONE select whose options are exactly Upfront/Level 30/Spread 20
 * with no "Please Select" prefix — this is the agency-wide default dropdown.
 */
async function getDefaultAgencySelectInfo(page) {
  return page.evaluate(() => {
    const sels = [...document.querySelectorAll('select')];
    const match = sels.find((s) => {
      const opts = [...s.options].map((o) => o.text);
      return opts.length === 3 && opts.includes('Upfront') && opts.includes('Level 30') && opts.includes('Spread 20');
    });
    if (!match) return null;
    return { id: match.id, options: [...match.options].map((o) => o.text), selectedIndex: match.selectedIndex };
  });
}

/** Reads the "Default for Agency (...)" label text, including the agency number(s). */
async function getDefaultAgencyLabelText(page) {
  return page.evaluate(() => {
    const idx = document.body.innerText.indexOf('Default for Agency');
    return idx === -1 ? null : document.body.innerText.slice(idx, idx + 100);
  });
}

/**
 * Fingerprint: select whose first option is "Please Select" and remaining options
 * all look like "IC-nn%, RC-nn%" — this is the "Select IC/RC" pick list.
 */
async function getIcRcSelectInfo(page) {
  return page.evaluate(() => {
    const sels = [...document.querySelectorAll('select')];
    const match = sels.find((s) => {
      const opts = [...s.options].map((o) => o.text);
      if (opts.length < 2 || opts[0] !== 'Please Select') return false;
      return opts.slice(1).every((o) => /^IC-\d+%, RC-\d+%$/.test(o));
    });
    if (!match) return null;
    return { id: match.id, options: [...match.options].map((o) => o.text), selectedIndex: match.selectedIndex };
  });
}

/**
 * Fingerprint: nearest-label technique to distinguish "Life Cover" (per-cover row,
 * status display) from "Select All" (bulk-apply control, legitimately blank at open).
 */
async function getLifeCoverCategoryInfo(page) {
  return page.evaluate(() => {
    function nearestLabelText(el) {
      let node = el;
      for (let depth = 0; depth < 4 && node; depth++) {
        let sib = node.previousElementSibling;
        while (sib) {
          const t = (sib.innerText || '').trim();
          if (t) return t.split('\n')[0].slice(0, 60);
          sib = sib.previousElementSibling;
        }
        node = node.parentElement;
      }
      return null;
    }
    const sels = [...document.querySelectorAll('select')];
    const match = sels.find((s) => (nearestLabelText(s) || '').includes('Life Cover'));
    if (!match) return null;
    return { options: [...match.options].map((o) => o.text), selectedIndex: match.selectedIndex };
  });
}

/** Reads the Update button's disabled state, or null if it's not present. */
async function getUpdateButtonInfo(page) {
  return page.evaluate(() => {
    const b = [...document.querySelectorAll('button')].find((x) => x.innerText.trim() === 'Update');
    return b ? { disabled: b.disabled } : null;
  });
}

/** Clicks the Update button. */
async function clickUpdate(page) {
  await page.evaluate(() => {
    const btn = [...document.querySelectorAll('button')].find((b) => b.innerText.trim().split('\n')[0] === 'Update');
    if (btn) btn.click();
  });
  await waitForSettle(page, 2000);
}

/** Selects a new Default-for-Agency value by label (does not click Update). */
async function setDefaultAgency(page, label) {
  const info = await getDefaultAgencySelectInfo(page);
  if (!info) throw new Error('Default-for-Agency select not found');
  await page.locator(`#${info.id}`).selectOption({ label });
  await waitForSettle(page, 800);
}

/** True if the AC07 confirmation message is currently visible anywhere on the page. */
async function bodyContainsConfirmationMessage(page) {
  return page.evaluate(() => document.body.innerText.includes('Your default commission structure setting has been updated.'));
}

module.exports = {
  openAdviserUse,
  closeAdviserUse,
  setFlexiRate,
  getDefaultAgencySelectInfo,
  getDefaultAgencyLabelText,
  getIcRcSelectInfo,
  getLifeCoverCategoryInfo,
  getUpdateButtonInfo,
  clickUpdate,
  setDefaultAgency,
  bodyContainsConfirmationMessage,
};
