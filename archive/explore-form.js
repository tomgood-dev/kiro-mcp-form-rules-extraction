const fs = require('fs');

const OUT = 'C:\\Users\\tom.good_phoenix-dx\\Desktop\\form-report\\';

const PROCEED_WORDS = ['apply', 'next', 'continue', 'proceed', 'calculate', 'get quote', 'submit', 'save & continue'];

const TEST_VALUES = {
  text:   ['', 'A', 'x'.repeat(300), '123', 'Test User', '<script>alert(1)</script>'],
  email:  ['', 'notanemail', 'test@', 'test@domain.com'],
  number: ['', '-1', '0', '1', '10', '75', '76', '999', 'abc'],
  date:   ['', '1900-01-01', '2000-01-01', '2026-01-01', '2099-01-01'],
  tel:    ['', '123', '0212345678', '+6421000000'],
};

const VALID_BY_LABEL = {
  'first name':        'John',
  'last name':         'Smith',
  'date of birth':     '1980-01-15',
  'birth':             '1980-01-15',
  'age':               '46',
  'email':             'john.smith@example.com',
  'phone':             '0212345678',
  'income':            '75000',
  'sum insured':       '500000',
  'amount':            '100000',
  'benefit':           '100000',
  'address':           '123 Test Street',
  'suburb':            'Auckland',
  'city':              'Auckland',
  'postcode':          '1010',
};

// Buttons to skip — navigation/footer controls that would leave the form or save prematurely
const NAV_SKIP_RE = /^(close|cancel|save|apply|next|back|submit|sign\s*out|view\s*pdf|save\s*as\s*new|new\s*quote|add\s*life|resume|loading|loading\.\.\.|skip\s*to\s*content|refresh\s*content|life\s*\d+|\d+)$/i;

// ── Helpers ───────────────────────────────────────────────────────────────────

function fieldKey(f) {
  return f.id || f.name || `${f.tag}:${f.label}`;
}

function selector(field) {
  if (field.id)   return `[id="${field.id}"]`;
  if (field.name) return `[name="${field.name}"]`;
  return null;
}

function escRx(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ── Field discovery ───────────────────────────────────────────────────────────

async function discoverFields(page) {
  return page.$$eval(
    'input:not([type="hidden"]):not([type="submit"]):not([type="button"]):not([type="radio"]):not([type="checkbox"]), select, textarea',
    els => els.map(el => {
      const byFor       = el.id && document.querySelector(`label[for="${el.id}"]`);
      const byAriaLabel = el.getAttribute('aria-label');
      let contextLabel  = null;
      let parent = el.parentElement;
      for (let i = 0; i < 6; i++) {
        if (!parent) break;
        const found = parent.querySelector('label, legend, [class*="label"], [class*="title"]');
        if (found && found !== el && !found.contains(el)) { contextLabel = found.innerText?.trim(); break; }
        parent = parent.parentElement;
      }
      const label = (
        byFor?.innerText?.trim() ||
        byAriaLabel ||
        contextLabel ||
        el.placeholder ||
        el.name ||
        '(unlabelled)'
      ).replace(/\s+/g, ' ').substring(0, 80);

      return {
        tag:         el.tagName.toLowerCase(),
        type:        el.getAttribute('type') || el.tagName.toLowerCase(),
        id:          el.id || null,
        name:        el.name || null,
        label,
        placeholder: el.placeholder || null,
        required:    el.required,
        maxlength:   el.maxLength > 0 ? el.maxLength : null,
        disabled:    el.disabled,
        options:     el.tagName === 'SELECT'
          ? [...el.options].map(o => ({ value: o.value, text: o.text.trim() }))
          : null,
      };
    })
  );
}

async function discoverRadioGroups(page) {
  return page.$$eval('input[type="radio"]', radios => {
    const groups = {};
    for (const r of radios) {
      const name = r.name || r.id || '(unnamed)';
      if (!groups[name]) {
        const label =
          r.closest('fieldset')?.querySelector('legend')?.innerText?.trim() ||
          document.querySelector(`label[for="${r.id}"]`)?.innerText?.trim() ||
          r.getAttribute('aria-label') ||
          name;
        groups[name] = { name, label, options: [] };
      }
      const optLabel =
        r.closest('label')?.innerText?.trim() ||
        document.querySelector(`label[for="${r.id}"]`)?.innerText?.trim() ||
        r.value;
      groups[name].options.push({ value: r.value, label: optLabel, id: r.id });
    }
    return Object.values(groups);
  });
}

function diffFields(before, after) {
  const beforeKeys = new Set(before.map(fieldKey));
  const afterKeys  = new Set(after.map(fieldKey));
  return {
    appeared:    after.filter(f => !beforeKeys.has(fieldKey(f))),
    disappeared: before.filter(f => !afterKeys.has(fieldKey(f))),
  };
}

// ── Error capture ─────────────────────────────────────────────────────────────

async function getErrorMessages(page) {
  const raw = await page.$$eval(
    '[class*="error"], [class*="invalid"], [class*="feedback"], [class*="validation"], [class*="message"], [class*="alert"], [role="alert"]',
    els => {
      const seen = new Set();
      return els.flatMap(el => {
        const text = el.innerText?.trim() || '';
        if (!text || text.length > 400) return [];
        if (/^(Male\nFemale|Yes\nNo|Select one|None|N\/A)$/i.test(text)) return [];
        if (seen.has(text)) return [];
        seen.add(text);
        return [text];
      });
    }
  );
  return raw.filter(t =>
    /required|invalid|between|least|maximum|minimum|cannot|must|please|select|error|exceed|format/i.test(t)
  );
}

// ── Modal / panel detection and handling ──────────────────────────────────────

async function handleAnyModal(page, lockedFields) {
  const hasModal = await page.evaluate(() => {
    // Check by ARIA role first (most reliable)
    const byRole = document.querySelector('[role="dialog"], [role="alertdialog"]');
    if (byRole) {
      const rect = byRole.getBoundingClientRect();
      if (rect.width > 100 && rect.height > 50) return true;
    }
    // Fall back to common class patterns
    const byClass = document.querySelector('[class*="modal"],[class*="popup"],[class*="overlay"],[class*="lightbox"]');
    if (byClass) {
      const s = window.getComputedStyle(byClass);
      if (s.display !== 'none' && s.visibility !== 'hidden') {
        const rect = byClass.getBoundingClientRect();
        if (rect.width > 100 && rect.height > 50) return true;
      }
    }
    return false;
  });

  if (!hasModal) return false;

  console.log('    ↳ Modal/dialog detected — filling its fields...');

  // Fill everything visible (modal fields will be visible)
  const fields = await discoverFields(page);
  const radios = await discoverRadioGroups(page);
  await fillAllFields(page, fields, radios, lockedFields);
  await page.waitForTimeout(500);

  const CONFIRM = ['Done', 'Confirm', 'Add', 'OK', 'Accept', 'Apply', 'Select', 'Continue', 'Save'];
  const modalSel = '[role="dialog"],[role="alertdialog"],[class*="modal"],[class*="popup"]';

  for (const word of CONFIRM) {
    const btn = page.locator(modalSel)
      .locator('button, a, [role="button"]')
      .filter({ hasText: new RegExp(`^${escRx(word)}$`, 'i') })
      .first();
    if (await btn.isVisible().catch(() => false)) {
      await btn.click().catch(() => {});
      await page.waitForTimeout(800);
      await page.locator('text=Loading').waitFor({ state: 'hidden', timeout: 10000 }).catch(() => {});
      console.log(`    ↳ Closed modal with "${word}"`);
      return true;
    }
  }

  // Fallback: last button in modal area
  const anyBtn = page.locator(modalSel).locator('button, a, [role="button"]').last();
  if (await anyBtn.isVisible().catch(() => false)) {
    const t = (await anyBtn.textContent().catch(() => ''))?.trim();
    await anyBtn.click().catch(() => {});
    await page.waitForTimeout(800);
    console.log(`    ↳ Closed modal via fallback "${t}"`);
    return true;
  }

  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);
  console.log('    ↳ Modal dismissed via Escape');
  return true;
}

// ── Action button discovery + interaction ─────────────────────────────────────

async function getAllActionButtons(page) {
  const { candidates, debugAll } = await page.evaluate((skipSrc) => {
    const SKIP = new RegExp(skipSrc, 'i');
    const candidates = [];
    const debugAll = [];
    const seen = new Set();

    document.querySelectorAll('button, a, [role="button"]').forEach(el => {
      const text = (el.innerText || el.textContent || el.getAttribute('aria-label') || '')
        .trim().replace(/\s+/g, ' ');
      const ariaExpanded = el.getAttribute('aria-expanded');
      const inFooter = !!el.closest('footer, [class*="footer"]');
      const rect = el.getBoundingClientRect();
      const visible = rect.width > 0 || rect.height > 0;

      debugAll.push({
        text: text.substring(0, 70),
        ariaExpanded,
        inFooter,
        visible,
        id: el.id || null,
      });

      if (!visible) return;
      if (inFooter) return;
      if (!text || text.length < 2 || text.length > 100) return;
      if (SKIP.test(text)) return;
      // Skip toggles that are already OPEN — clicking them would CLOSE the section
      if (ariaExpanded === 'true') return;

      const key = el.id ? `id:${el.id}` : `text:${text}`;
      if (seen.has(key)) return;
      seen.add(key);

      // isToggle = has aria-expanded attribute → it's a collapsible section header
      candidates.push({
        text: text.substring(0, 60),
        id: el.id || null,
        isToggle: ariaExpanded !== null,
      });
    });

    return { candidates, debugAll };
  }, NAV_SKIP_RE.source);

  // Debug: log all visible non-footer buttons each scan
  const visibleBtns = debugAll.filter(b => b.visible && !b.inFooter && b.text.length >= 2);
  console.log(`    [scan] ${visibleBtns.length} visible buttons:`);
  visibleBtns.forEach(b => {
    const exp = b.ariaExpanded !== null ? ` [expanded=${b.ariaExpanded}]` : '';
    console.log(`      "${b.text}"${exp}`);
  });

  return candidates;
}

async function clickAllActionButtons(page, clickedKeys, lockedFields, pageIndex, round) {
  // Scroll the full page to expose all elements before scanning
  await page.evaluate(() => {
    window.scrollTo(0, 0);
    document.querySelectorAll('*').forEach(el => {
      const s = window.getComputedStyle(el);
      if ((s.overflowY === 'auto' || s.overflowY === 'scroll') && el.scrollHeight > el.clientHeight) {
        el.scrollTop = 0;
      }
    });
  });
  await page.waitForTimeout(300);

  const candidates = await getAllActionButtons(page);
  const fresh = candidates.filter(b => {
    const key = b.id ? `id:${b.id}` : `text:${b.text}`;
    return !clickedKeys.has(key);
  });

  if (fresh.length === 0) return 0;

  let clickCount = 0;

  for (const btn of fresh) {
    const key = btn.id ? `id:${btn.id}` : `text:${btn.text}`;

    // Locate the element
    let loc;
    if (btn.id) {
      loc = page.locator(`[id="${btn.id}"]`).first();
    } else {
      loc = page.locator('button, a, [role="button"]')
        .filter({ hasText: btn.text })
        .first();
    }

    if (!await loc.isVisible().catch(() => false)) continue;

    console.log(`    Clicking: "${btn.text}"`);

    await loc.scrollIntoViewIfNeeded().catch(() => {});
    await loc.click({ force: true }).catch(() => {});
    await page.waitForTimeout(1200);
    await page.locator('text=Loading').waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(400);

    // Safety: if we left the Quote form, go back
    if (!page.url().includes('/Quote')) {
      console.log(`    ↳ Navigated to ${page.url().substring(0, 70)} — going back`);
      await page.goBack().catch(() => {});
      await page.waitForTimeout(1500);
      await page.locator('text=Loading').waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {});
      // Don't mark as clicked — it was a nav link, not an action button
      continue;
    }

    // Only lock action buttons (not toggles) — toggles are re-evaluated by aria-expanded each cycle
    if (!btn.isToggle) {
      clickedKeys.add(key);
    }
    clickCount++;

    // Handle any modal/dialog that appeared
    await handleAnyModal(page, lockedFields);

    // Fill any new fields that appeared (inline panels, accordion expansions)
    const newFields = await discoverFields(page);
    const newRadios = await discoverRadioGroups(page);
    await fillAllFields(page, newFields, newRadios, lockedFields);
    await page.waitForTimeout(300);

    await page.screenshot({
      path: `${OUT}page${pageIndex}-interact-r${round}-${clickCount}.png`,
      fullPage: true,
    }).catch(() => {});
  }

  return clickCount;
}

// ── Error resolution ──────────────────────────────────────────────────────────

async function resolveErrors(page, errors, fields, radioGroups, locked = new Set()) {
  console.log(`  Resolving ${errors.length} error(s)...`);

  for (const error of errors) {
    const low = error.toLowerCase();
    console.log(`  → "${error}"`);

    // "X should be between MIN and MAX"
    const rangeMatch = error.match(/between (\d+) and (\d+)/i);
    if (rangeMatch) {
      const mid = Math.floor((parseInt(rangeMatch[1]) + parseInt(rangeMatch[2])) / 2);
      const fieldName = error.split(/should be|must be/i)[0].trim().toLowerCase();
      const target = fields.find(f => f.label.toLowerCase().includes(fieldName) && f.type === 'number');
      if (target) {
        const sel = selector(target);
        await page.locator(sel).first().fill(String(mid)).catch(() => {});
        await page.waitForTimeout(300);
        locked.add(fieldKey(target));
        console.log(`    Fixed: set "${target.label}" to ${mid}`);
        continue;
      }
    }

    // "We Pay Your Premiums" / lump sum dependency — reset to None
    if (low.includes('we pay your premiums') || low.includes('lump sum cover must be selected')) {
      const premiumField = fields.find(f =>
        f.type === 'select' &&
        f.options?.some(o => /\d+\s*day/i.test(o.text)) &&
        f.options?.some(o => /none|0/i.test(o.text) || o.value === '' || o.value === '0')
      );
      if (premiumField) {
        const none = premiumField.options.find(o =>
          /^none$/i.test(o.text) || o.value === '0' || o.value === ''
        );
        const target = none || premiumField.options[0];
        await page.selectOption(selector(premiumField), target.value).catch(() => {});
        await page.waitForTimeout(300);
        locked.add(fieldKey(premiumField));
        console.log(`    Fixed: reset We Pay Your Premiums to "${target.text}"`);
        continue;
      }
    }

    // Generic "required" / empty — match field by label fragment
    if (low.includes('required') || low.includes('cannot be empty') || low.includes('must not be empty')) {
      const matchedField = fields.find(f =>
        f.label !== '(unlabelled)' && low.includes(f.label.toLowerCase())
      );
      if (matchedField) {
        await fillOneField(page, matchedField);
        locked.add(fieldKey(matchedField));
        console.log(`    Fixed: filled required field "${matchedField.label}"`);
      }
      continue;
    }

    // "Select / choose" — find relevant radio group
    if (low.includes('select') || low.includes('choose')) {
      const matchedGroup = radioGroups.find(g => low.includes(g.label.toLowerCase()));
      if (matchedGroup?.options[0]) {
        await page.locator(`[id="${matchedGroup.options[0].id}"]`).check().catch(() => {});
        console.log(`    Fixed: selected first option of "${matchedGroup.label}"`);
      }
    }
  }
}

// ── Filling strategies ────────────────────────────────────────────────────────

function validValueForField(field) {
  for (const [fragment, value] of Object.entries(VALID_BY_LABEL)) {
    if (field.label.toLowerCase().includes(fragment)) return value;
  }
  if (field.type === 'number') return '30';
  if (field.type === 'date')   return '1980-01-15';
  if (field.type === 'email')  return 'john.smith@example.com';
  if (field.type === 'tel')    return '0212345678';
  return 'Test';
}

async function fillOneField(page, field) {
  const sel = selector(field);
  if (!sel) return;
  const locator = page.locator(sel).first();
  if (!await locator.isVisible().catch(() => false)) return;
  if (field.disabled) return;
  const value = validValueForField(field);
  await locator.fill(value).catch(() => {});
  await page.waitForTimeout(150);
}

async function fillAllFields(page, fields, radioGroups, locked = new Set()) {
  // Text / number / date / email / tel
  for (const field of fields) {
    if (locked.has(fieldKey(field))) continue;
    if (['select', 'checkbox'].includes(field.type)) continue;
    await fillOneField(page, field);
  }

  // Selects — pick first real (non-placeholder) option
  for (const field of fields) {
    if (locked.has(fieldKey(field))) continue;
    if (field.type !== 'select' || !field.options) continue;
    const sel = selector(field);
    if (!sel) continue;
    if (!await page.locator(sel).first().isVisible().catch(() => false)) continue;
    const firstReal = field.options.find(o =>
      o.value && o.value !== '-1' && !['Select one', '', 'None', 'N/A'].includes(o.text)
    );
    if (firstReal) {
      await page.selectOption(sel, firstReal.value).catch(() => {});
      await page.waitForTimeout(200);
    }
  }

  // Radio groups — select first option
  for (const group of radioGroups) {
    const first = group.options[0];
    if (!first?.id) continue;
    const locator = page.locator(`[id="${first.id}"]`).first();
    if (!await locator.isVisible().catch(() => false)) continue;
    await locator.check().catch(() => {});
    await page.waitForTimeout(150);
  }
}

// ── Proceed button ────────────────────────────────────────────────────────────

async function findProceedButton(page) {
  // Scroll to bottom so footer buttons become visible
  await page.evaluate(() => {
    window.scrollTo(0, document.body.scrollHeight);
    document.querySelectorAll('*').forEach(el => {
      const s = window.getComputedStyle(el);
      if (s.overflowY === 'auto' || s.overflowY === 'scroll') el.scrollTop = el.scrollHeight;
    });
  });
  await page.waitForTimeout(500);

  // 1. Direct exact-text (most reliable for OutSystems)
  for (const word of PROCEED_WORDS) {
    const cap = word.charAt(0).toUpperCase() + word.slice(1);
    for (const variant of [cap, word.toUpperCase(), word]) {
      const loc = page.locator(`text="${variant}"`).first();
      if (await loc.isVisible().catch(() => false)) return loc;
    }
  }

  // 2. Role-based
  for (const word of PROCEED_WORDS) {
    const btn = page.getByRole('button', { name: new RegExp(word, 'i') }).first();
    if (await btn.isVisible().catch(() => false)) return btn;
    const lnk = page.getByRole('link', { name: new RegExp(word, 'i') }).first();
    if (await lnk.isVisible().catch(() => false)) return lnk;
  }

  // 3. Filter sweep
  for (const word of PROCEED_WORDS) {
    const loc = page.locator('button, a, [role="button"]')
      .filter({ hasText: new RegExp(word, 'i') }).first();
    if (await loc.isVisible().catch(() => false)) return loc;
  }

  // 4. Footer fallback
  const footerBtn = page.locator('footer button, [class*="footer"] button, [class*="footer"] a').first();
  if (await footerBtn.isVisible().catch(() => false)) return footerBtn;

  // 5. Debug
  const currentUrl = page.url();
  const allBtnTexts = await page.evaluate(() =>
    [...document.querySelectorAll('button, a, [role="button"]')]
      .map(el => (el.innerText || el.textContent || '').trim().substring(0, 40))
      .filter(t => t.length > 0)
      .slice(0, 30)
  );
  console.log(`  DEBUG url: ${currentUrl}`);
  console.log(`  DEBUG buttons: ${JSON.stringify(allBtnTexts)}`);
  await page.screenshot({ path: `${OUT}debug-no-proceed-button.png`, fullPage: true });

  return null;
}

// ── Probing ───────────────────────────────────────────────────────────────────

async function probeTextField(page, field, observations, idx) {
  const sel = selector(field);
  if (!sel) return;
  const values = TEST_VALUES[field.type] || TEST_VALUES.text;

  for (const value of values) {
    const locator = page.locator(sel).first();
    if (!await locator.isVisible().catch(() => false)) continue;
    await locator.fill(value).catch(() => {});
    await page.keyboard.press('Tab');
    await page.waitForTimeout(400);

    const messages = await getErrorMessages(page);
    const slug = `${String(idx).padStart(2,'0')}-${field.label.replace(/[^a-z0-9]/gi,'_').substring(0,20)}-${value.length > 15 ? value.length+'ch' : (value||'EMPTY')}`;
    const shot = messages.length ? `${OUT}probe-${slug}.png` : null;
    if (shot) await page.screenshot({ path: shot, fullPage: true }).catch(() => {});

    observations.push({
      phase: 'probe', field: field.label, fieldId: field.id,
      type: field.type, value: value.length > 50 ? `[${value.length} chars]` : (value || '(empty)'),
      messages, screenshot: shot,
    });
  }
}

async function probeSelectField(page, field, observations, idx) {
  const sel = selector(field);
  if (!sel || !field.options) return;

  for (const option of field.options) {
    if (!option.value && option.value !== '0') continue;
    if (!await page.locator(sel).first().isVisible().catch(() => false)) continue;

    const before = await discoverFields(page);
    await page.selectOption(sel, option.value).catch(() => {});
    await page.waitForTimeout(600);

    const messages = await getErrorMessages(page);
    const after = await discoverFields(page);
    const diff = diffFields(before, after);

    const slug = `${String(idx).padStart(2,'0')}-${field.label.replace(/[^a-z0-9]/gi,'_').substring(0,20)}-${option.text.replace(/[^a-z0-9]/gi,'_').substring(0,15)}`;
    const shot = (messages.length || diff.appeared.length) ? `${OUT}probe-${slug}.png` : null;
    if (shot) await page.screenshot({ path: shot, fullPage: true }).catch(() => {});

    observations.push({
      phase: 'probe', field: field.label, fieldId: field.id, type: 'select', value: option.text,
      messages,
      fieldsAppeared:  diff.appeared.map(f => ({ label: f.label, type: f.type, id: f.id })),
      fieldsHidden:    diff.disappeared.map(f => ({ label: f.label, type: f.type, id: f.id })),
      screenshot: shot,
    });
  }
}

async function probeRadioGroup(page, group, observations, idx) {
  for (const option of group.options) {
    if (!option.id) continue;
    const locator = page.locator(`[id="${option.id}"]`).first();
    if (!await locator.isVisible().catch(() => false)) continue;

    const before = await discoverFields(page);
    await locator.check().catch(() => {});
    await page.waitForTimeout(400);

    const messages = await getErrorMessages(page);
    const after = await discoverFields(page);
    const diff = diffFields(before, after);

    const slug = `${String(idx).padStart(2,'0')}-radio-${group.label.replace(/[^a-z0-9]/gi,'_').substring(0,20)}-${option.label.replace(/[^a-z0-9]/gi,'_').substring(0,15)}`;
    const shot = (messages.length || diff.appeared.length) ? `${OUT}probe-${slug}.png` : null;
    if (shot) await page.screenshot({ path: shot, fullPage: true }).catch(() => {});

    observations.push({
      phase: 'probe', field: group.label, type: 'radio', value: option.label,
      messages,
      fieldsAppeared:  diff.appeared.map(f => ({ label: f.label, type: f.type, id: f.id })),
      fieldsHidden:    diff.disappeared.map(f => ({ label: f.label, type: f.type, id: f.id })),
      screenshot: shot,
    });
  }
}

// ── Page-level exploration ────────────────────────────────────────────────────

async function explorePage(page, pageIndex) {
  const pageReport = {
    pageIndex,
    url:          page.url(),
    capturedAt:   new Date().toISOString(),
    fields:       [],
    radioGroups:  [],
    observations: [],
  };

  await page.screenshot({ path: `${OUT}page${pageIndex}-00-initial.png`, fullPage: true });
  pageReport.fields      = await discoverFields(page);
  pageReport.radioGroups = await discoverRadioGroups(page);

  console.log(`\n[Page ${pageIndex}] ${page.url()}`);
  console.log(`  Discovered ${pageReport.fields.length} fields, ${pageReport.radioGroups.length} radio groups`);

  // Step A: Click proceed empty to surface mandatory errors
  console.log('  Step A: Submit empty to surface mandatory fields...');
  const btn = await findProceedButton(page);
  if (btn) {
    await btn.click().catch(() => {});
    await page.waitForTimeout(1000);
    const emptyErrors = await getErrorMessages(page);
    await page.screenshot({ path: `${OUT}page${pageIndex}-01-submit-empty.png`, fullPage: true });
    pageReport.observations.push({
      phase: 'submit-empty', event: 'clicked-proceed-with-empty-form',
      messages: emptyErrors,
      screenshot: `${OUT}page${pageIndex}-01-submit-empty.png`,
    });
    console.log(`    Captured ${emptyErrors.length} mandatory error(s)`);
  } else {
    console.log('    No proceed button found at Step A');
  }

  // Step B: Probe text fields
  const inputFields = pageReport.fields.filter(f => !['select'].includes(f.type));
  for (let i = 0; i < inputFields.length; i++) {
    const field = inputFields[i];
    if (['checkbox'].includes(field.type)) continue;
    console.log(`  Step B [${i+1}/${inputFields.length}]: Probing "${field.label}"`);
    await probeTextField(page, field, pageReport.observations, i);
  }

  // Step C: Probe radio groups
  for (let i = 0; i < pageReport.radioGroups.length; i++) {
    const group = pageReport.radioGroups[i];
    console.log(`  Step C [${i+1}/${pageReport.radioGroups.length}]: Probing radio "${group.label}"`);
    await probeRadioGroup(page, group, pageReport.observations, i);
  }

  // Step D: Probe selects
  const selectFields = pageReport.fields.filter(f => f.type === 'select');
  for (let i = 0; i < selectFields.length; i++) {
    const field = selectFields[i];
    console.log(`  Step D [${i+1}/${selectFields.length}]: Probing select "${field.label}"`);
    await probeSelectField(page, field, pageReport.observations, i);
  }

  return pageReport;
}

// ── Smart fill + proceed (cycle-based) ───────────────────────────────────────

async function fillAndProceed(page, pageReport, pageIndex) {
  const MAX_CYCLES = 8;
  const lockedFields = new Set();
  // Track every button we've clicked — prevents infinite re-clicking
  const clickedKeys = new Set();

  console.log(`\n[Page ${pageIndex}] Interacting with all elements and proceeding...`);

  for (let cycle = 1; cycle <= MAX_CYCLES; cycle++) {
    console.log(`\n  ── Cycle ${cycle} / ${MAX_CYCLES} ──  ${page.url().substring(0, 80)}`);

    // 1. Fill all visible form fields
    const currentFields = await discoverFields(page);
    const currentRadios = await discoverRadioGroups(page);
    await fillAllFields(page, currentFields, currentRadios, lockedFields);
    await page.waitForTimeout(400);

    // 2. Click every unclicked action button (cover adds, accordion toggles, panel openers, etc.)
    console.log('  Clicking all new action buttons...');
    const clickCount = await clickAllActionButtons(page, clickedKeys, lockedFields, pageIndex, cycle);
    console.log(`    ${clickCount} new button(s) clicked`);

    // 3. Re-fill fields that may have revealed themselves after button interactions
    if (clickCount > 0) {
      const updatedFields = await discoverFields(page);
      const updatedRadios = await discoverRadioGroups(page);
      await fillAllFields(page, updatedFields, updatedRadios, lockedFields);
      await page.waitForTimeout(400);
    }

    // 4. Check remaining errors and try to resolve them
    const errors = await getErrorMessages(page);
    await page.screenshot({ path: `${OUT}page${pageIndex}-cycle${cycle}.png`, fullPage: true });
    console.log(`  Errors: ${errors.length}`);

    if (errors.length > 0) {
      const fields = await discoverFields(page);
      const radios = await discoverRadioGroups(page);
      await resolveErrors(page, errors, fields, radios, lockedFields);
      await page.waitForTimeout(400);
    }

    // 5. Attempt proceed
    const proceedBtn = await findProceedButton(page);
    if (!proceedBtn) {
      console.log('  Proceed button not found — pausing for manual inspection');
      pageReport.observations.push({ phase: 'proceed', event: 'button-not-found', cycle });
      await page.pause();
      return false;
    }

    const urlBefore = page.url();
    await proceedBtn.click();
    await page.waitForTimeout(2000);
    await page.locator('text=Loading').waitFor({ state: 'hidden', timeout: 30000 }).catch(() => {});
    await page.waitForTimeout(1000);

    const urlAfter = page.url();
    const navigated = urlAfter !== urlBefore;
    await page.screenshot({ path: `${OUT}page${pageIndex}-after-proceed.png`, fullPage: true });

    const errorsAfter = await getErrorMessages(page);

    pageReport.observations.push({
      phase: 'proceed', event: navigated ? 'navigated' : 'stayed-on-page',
      cycle, urlBefore, urlAfter, errors: errorsAfter,
      screenshot: `${OUT}page${pageIndex}-after-proceed.png`,
    });

    if (navigated) {
      console.log(`  Navigated to: ${urlAfter}`);
      return true;
    }

    console.log(`  Did not navigate — ${errorsAfter.length} error(s) remaining`);

    // If no errors remain and no navigation, this might be the final state (form complete)
    if (errorsAfter.length === 0) {
      console.log('  No errors, no navigation — form may be in final state');
      return false;
    }

    // If we have errors but nothing new to click, we're stuck
    if (clickCount === 0 && errorsAfter.length > 0) {
      console.log(`  Stuck: no new buttons available, ${errorsAfter.length} error(s) persist`);
      console.log('  Errors:');
      errorsAfter.forEach(e => console.log(`    - ${e}`));
      pageReport.observations.push({
        phase: 'proceed', event: 'stuck',
        errors: errorsAfter,
        screenshot: `${OUT}page${pageIndex}-after-proceed.png`,
      });
      await page.pause();
      return false;
    }
  }

  console.log(`  Max cycles (${MAX_CYCLES}) reached`);
  pageReport.observations.push({ phase: 'proceed', event: 'max-cycles-reached' });
  await page.pause();
  return false;
}

// ── Main export ───────────────────────────────────────────────────────────────

async function exploreForm(page) {
  if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });

  const fullReport = { pages: [], capturedAt: new Date().toISOString() };
  let pageIndex = 0;
  const MAX_PAGES = 10;

  while (pageIndex < MAX_PAGES) {
    const pageReport = await explorePage(page, pageIndex);
    const navigated  = await fillAndProceed(page, pageReport, pageIndex);

    fullReport.pages.push(pageReport);
    fs.writeFileSync(`${OUT}form-report.json`, JSON.stringify(fullReport, null, 2));
    console.log(`\nReport updated (page ${pageIndex} complete)`);

    if (!navigated) break;

    pageIndex++;
    await page.waitForTimeout(1000);
  }

  console.log(`\nExploration complete. ${pageIndex + 1} page(s) explored.`);
  return fullReport;
}

module.exports = { exploreForm };
