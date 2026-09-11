# Handover — AI-Assisted Business Rule Extraction & Test Generation

**Purpose:** the single "start here" document for whoever takes this over. It orients you to what
exists, how the process runs day-to-day, and where every other doc fits. It does **not** repeat
those docs — it points to them.

**Last updated:** 2026-09-11.

---

## 1. What this is, in one paragraph

A repeatable, AI-driven method (and the tooling around it) for discovering the business rules
inside a live web application, turning them into verified Playwright regression tests, and
producing evidence a BA/PM/dev can act on. Proven on the Asteron Life Quote & Apply form
(OutSystems), but the framework is app-agnostic — point it at another app via `TARGET_APP`.

---

## 2. Read these first (in order)

| # | Doc | What it gives you |
|---|---|---|
| 1 | `README.md` | Framework overview + how the pieces fit. |
| 2 | `docs/METHOD.md` | The method explained for PM/testers — why it's trustworthy. |
| 3 | `WRAPPER.md` | How to actually run it (setup → new app → explore/generate → test → view). |
| 4 | `.kiro/steering/test-expansion-process.md` | **The rulebook.** How tests are authored, probe safety, evidence, the AC-mode process. Non-negotiable. |
| 5 | `TEST-GENERATION-PROCESS.md` | The step-by-step story→tests procedure the AI follows. |
| 6 | `.kiro/steering/project-context.md` | Asteron-specific facts (env, login, DOM quirks, mandatory fields). |
| 7 | `.kiro/steering/reference-reconciliation.md` | How to use a client's existing test suite without letting stale material corrupt ours. |
| 8 | `ROADMAP.md` | Where the engagement is heading + phase status. |

---

## 3. How the process runs (the loop)

```
   Materials (user stories / existing BRs / reference)  ──►  apps/<app>/inbox/
                                   │
              ┌────────────────────┴────────────────────┐
              ▼                                          ▼
      EXPLORE mode                              GENERATE mode
   (no docs — reverse-engineer               (have BRs/stories — generate
    rules from the live app)                  regression tests from them)
              │                                          │
              └────────────────────┬────────────────────┘
                                   ▼
     Probe live → encode each AC (pass / expected-fail / deferred-with-evidence)
                                   ▼
     Run (edge config) → report.md + summary.json + .xlsx workbook per run
                                   ▼
     Dashboard rebuilds → view results (dashboard + report.md)
                                   ▼
     Update business-rules + test-documentation → commit atomically
```

The AI does the middle. The wrapper (`run.js`) onboards and routes into it. The rulebook
(steering) governs how it must behave (probe before asserting, verify surprising findings, never
silently omit an AC, evidence per run).

---

## 4. Day-to-day operation

Full commands are in `WRAPPER.md`. The essentials:

```
node run.js setup                 # one-time: deps + browsers
node run.js new <app>             # scaffold a new target app
node run.js explore <app>         # OR: generate <app>  → prints the Kiro CLI starting prompt
node run.js test <app>            # run the suite (edge config)
node run.js view <app>            # results viewer: dashboard + each run's report.md
```

- **Credentials/env:** `apps/<app>/.env` — `BASE_URL`, `LOGIN_EMAIL`, `LOGIN_PASSWORD` (gitignored).
- **Parallel runs across accounts:** `node tools/parallel-run.js` (accounts in `apps/<app>/accounts.json`).
- **Live exploration server (explore mode):** `node tools/server.js "<login-url>"` — see README.

---

## 5. Where things live

| Area | Path |
|---|---|
| Generic tooling (server, reporter, dashboard, parallel-run, viewer) | `tools/` |
| Per-app tests | `apps/<app>/tests/` |
| Per-app throwaway/retained probes | `apps/<app>/probes/` |
| Business rules (canonical, Rule-ID'd, with provenance) | `apps/<app>/docs/business-rules/` |
| Test documentation (one matrix per spec) | `apps/<app>/docs/test-documentation/` |
| Source user stories (AC-mode) | `apps/<app>/docs/user-stories/` |
| Run artifacts (report.md, summary.json, .xlsx) | `apps/<app>/test-runs/<spec>/<timestamp>/` |
| Suite dashboard | `apps/<app>/test-runs/DASHBOARD.md` + `dashboard.html` |
| Story→spec tracker | `apps/<app>/docs/user-story-tracker.md` |
| Coverage gap analysis | `apps/<app>/docs/coverage-gaps-2026-09-11.md` |

---

## 6. Current state of the Asteron worked example (2026-09-11)

- **Quote-screen coverage:** 478 ACs across 33 stories — 384 covered, 92 deferred (all with
  documented blockers), **2 MISSING** (Kids Cover AC08/AC09 — the one actionable gap). See
  `docs/coverage-gaps-2026-09-11.md`.
- **Apply flow:** confirmed reachable end-to-end (Client Summary → Duty of Disclosure) as of
  2026-09-11 — several older "Apply doesn't navigate" deferrals are now stale and re-testable.
- **Known real defects** (encoded as expected-fails, not test bugs): the per-mille $20 loadings
  cap not enforced (LOAD-D1); the 7 adviser-use commission regressions; premium bundling
  "12.5% vs 15%" discrepancy; occupation-code AA typeahead not prepopulating. These stay red on
  purpose until the app is fixed — do NOT "fix" the tests to make them green.

---

## 7. The non-negotiables (most common ways to get this wrong)

1. **Probe before you assert.** Never encode an AC's expected value from a guess — confirm the
   real DOM/behaviour with a throwaway probe first.
2. **Verify a surprising finding before writing it up.** One clean run is a lead, not a finding —
   re-run with a different minimal script (see the steering doc's false-positive history).
3. **Never silently omit an AC.** Every AC is either encoded (pass/expected-fail) or
   `test.fixme(true, reason-with-probe-evidence)`. The gap report catches violations.
4. **The live app is the source of truth, not a dated doc.** A client's existing test suite / an
   old design spec is a *lead*, never ground truth (reference-reconciliation.md).
5. **A confirmed mismatch vs a user story is a candidate defect** — encode it as an expected-fail
   against the spec's value + a Discrepancy Evidence Record; don't bend the test to the app.
6. **Commit atomically** — spec + deprecated old version + test-doc + business-rule updates in one
   commit per completed unit.

---

## 8. Open threads / what a new owner would pick up next

- **Close the 2 MISSING kids-cover ACs** (AC08/AC09) — the only silent gap on the quote screen.
- **Re-test the stale Apply-flow deferrals** now that the Apply flow is reachable (Occupation,
  Navigation Behaviour, multi-lives Client-Summary ACs).
- **The 92 deferred ACs** — most need data fixtures (seeded landing rows, saved quotes), the
  pricing-engine reference (day-2 tax-tier values), or backend/STP access. Tackle the
  browser-reachable ones first (see the deferral reasons in each spec + the gap report).
- **Pricing/bundling stories** — apply the generate process to the new pricing/bundling user
  stories once located.
- **Enterprise handoff** — this is an interim capability designed to hand off to the enterprise
  AI-led QE workflow (ROADMAP.md).

---

## 9. Environment gotchas (learned the hard way — full detail in project-context.md)

- Use the **edge config** locally (`playwright.edge.config.js`) — Chromium is blocked by security tooling.
- **One active session per account** — a run that didn't sign out cleanly blocks the next login
  for ~60s; `global-setup.js` retries with backoff.
- **Mandatory fields fail silently** — a button that "does nothing" is almost always a blank
  required field (Date of Birth, Pre-tax Annual Income). Fill every `*` field first.
- **No npm in the runtime here** — the .xlsx workbook writer is dependency-free by necessity
  (`tools/lib/`). Don't add npm deps to that path.
- **Whitelisted-IP network** — the target app is only reachable from an approved IP.
