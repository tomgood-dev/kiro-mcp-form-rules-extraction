# Driving the App — navigation & interaction guide (READ before driving any screen)

Auto-loaded steering. This is the single reference for HOW to navigate and interact with the
Asteron Quote & Apply app reliably. It exists because navigating/interacting was repeatedly
mishandled (2026-09-14/15, hours lost). The app-behaviour facts (mandatory fields, DOM quirks,
the employment-details Apply gate, quote-build ordering) live in `project-context.md`
"Quote-build driving lessons" — this file is about the MECHANICS of driving.

## 1. How to drive live: the exploration server (preferred for investigation)

Use `tools/server.js` (a persistent headed browser + HTTP command API) for anything interactive —
NOT one-shot throwaway Playwright scripts (those run blind and are slow to iterate).

**Start it (logged in):**
```
# 1. refresh the account's auth state first (saved state goes stale in ~days — see project-context)
BASE_URL=<qa> LOGIN_EMAIL=<..> LOGIN_PASSWORD=<..> AUTH_STATE_FILENAME=state-qa-a.json KILL_STRAY_EDGE=true \
  node -e "require('./apps/asteron-quote-apply/global-setup.js')().then(()=>process.exit(0))"
# 2. launch the server against the quote list, seeded with that state (detached / minimized window)
node tools/server.js "https://outsystems-qa.asteronlife.co.nz/QuoteAndApply/" --storage-state apps/asteron-quote-apply/.auth/state-qa-a.json
```

**Send commands WITHOUT shell-quoting pain** — write a JSON array to a file and run it with
`batch.js` (do NOT hand-quote JSON into `Invoke-RestMethod`/`cmd.js` — nested quotes/regex break):
```
node tools/batch.js apps/<app>/probes/cmds.json     # cmds.json = [ {"action":"..."}, ... ]
```

**Command cheatsheet** (every WRITE action auto-returns `{url, errors, modals}` — the enforced
post-interaction sweep, so you always see what changed):
| Action | Use |
|---|---|
| `{"action":"state"}` | full page: buttons, fields, errors, modals |
| `{"action":"eval","code":"return ..."}` | run JS — **MUST use `return`** or result is undefined |
| `{"action":"click","selector":"text=X"}` or `{"id":"..."}` | real click (strict-mode: text must match ONE element) |
| `{"action":"select","id":"...","value"/"label":"..."}` | dropdown |
| `{"action":"calcmask","id":"...","value":"250000"}` | masked numeric fields (SI/benefit/income) — force-focuses first |
| `{"action":"type","id":"...","value":"..."}` | text/number input |
| `{"action":"tabs"}` | list open browser tabs (count + urls) |
| `{"action":"switch-tab"}` (or `{"index":N}`) | make the newest/Nth tab active — REQUIRED after New Quote |
| `{"action":"errors"}` | current on-screen validation errors |

## 2. The navigation map (dashboard → quote → apply flow)

```
Dashboard (/AdviserCentral_Uplift/Dashboard)
   │  ("Quotes" is a collapsible nav DIV, not a link — don't rely on clicking it)
   ▼  just navigate directly:
Quote & Apply list (/QuoteAndApply/)   ← has "New Quote", In-Progress table, status filter
   │  1. select an ADVISER in the Operating-as vscomp (#b5-DropdownSearchAdviser .vscomp-toggle-button)
   │     — MANDATORY; New Quote no-ops without it
   │  2. click "New Quote" (an <a>) → opens the quote in a NEW TAB (window.open)
   │  3. `switch-tab` to that new tab
   ▼
Quote screen (/QuoteAndApply/Quote?...)   ← build the quote here (see project-context ordering)
   │  Apply (footer btn-primary) — after satisfying the employment-details gate (occupation NAME
   │  per life via the "Select..." vscomp typeahead)
   ▼
Client Summary  →  Duty of Disclosure  →  Personal Details  →  (Occupation / Income / URE ... )
   (each step is a Previous/Next wizard; per-life "Proceed to application" on Client Summary)
```

- **To reach the quote list, `goto` `/QuoteAndApply/` directly** — don't fight the Dashboard "Quotes"
  menu (it's a collapsible group, flaky to click).
- **Do NOT deep-link the quote URL** to skip New Quote — that yields an inert Apply / no footer bar.
  You MUST enter via adviser-select → New Quote → new tab.

## 3. The interaction rules that cost hours (do these every time)

1. **Read the screen after EVERY interaction.** The server enforces this (write actions return
   errors+modals), but ACT on it: a $0.00 premium / inert button / "nothing happened" is almost
   always a dropped mandatory field or a validation error — NOT an app defect. Diagnose before concluding.
2. **`eval` code needs `return`** to get a value back. `{"action":"eval","code":"return {...}"}`.
3. **`click` by text is strict** — if the text matches >1 element it throws. Use an exact/unique
   selector or an `eval` that finds the one element by exact `.innerText` match.
4. **Dynamic ids:** OutSystems repeating-list ids contain a per-quote number that CHANGES every
   quote (e.g. `b23-l2-`**`1647`**`_0-b7-Input_SumInsured` → next quote `...`**`4826`**`...`). Never
   hardcode it — read the current id from the DOM right before using it. Never truncate an id
   (a partial id silently matches nothing).
5. **Masked fields** (SI/benefit/income): use `calcmask` / `fillCalcMask` (single `keyboard.type`).
   NEVER key-by-key `press` — it corrupts the mask to `.1.0.0..`. The displayed value may show mask
   separators (`.1.0.0.0.`) yet still be correct — trust the PREMIUM/validation, not the raw string.
6. **Multi-tab:** New Quote (and some list actions) open new tabs. After such an action, `tabs` to
   confirm and `switch-tab` to drive the new one. The server also auto-follows new tabs.
7. **Stale auth state fails silently** (lands on login). Refresh via global-setup before probing —
   see project-context "Saved auth state goes STALE".
8. **Windows long-path:** the transient `.test-runs-pending/` holding area can exceed MAX_PATH;
   clear it with `cmd /c rmdir /s /q "\\?\<path>"`, not `Remove-Item`.

## 4. In tests (not the live server)

The helpers in `apps/asteron-quote-apply/helpers/quote-helpers.js` already encode most of the above —
`openNewQuote` (adviser-select + New Quote popup + viewport), `completePersonalDetailsForApply`,
`fillCalcMask`, `fillAdviserUse` (sets every per-life commission dropdown), `clickApplyNow`,
`proceedThroughClientSummary`. **Reuse these** rather than re-deriving the interaction.

The employment-gate clearer `setOccupationName` (opens the "Select..." vscomp, searches, picks the
first occupation) and the `buildTwoLifeApplyReady` multi-life builder currently live in
`tests/quote-screen/multi-lives-and-policies-v1.spec.js` — promote them into `quote-helpers.js` when
another spec needs them. If a new screen needs a new pattern, add it to `quote-helpers.js` as a helper.
