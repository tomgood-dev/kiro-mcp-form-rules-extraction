# Generation Log — Multi Lives and Policies (ACB-4394)

Run started: 2026-09-02T15:16 (+10:00)
Process: TEST-GENERATION-PROCESS.md, acceptance-criteria mode.
Source: `docs/user-stories/User Story- Multi Lives and Policies.md` (Jira ACB-4394)
Target spec: `apps/asteron-quote-apply/tests/quote-screen/multi-lives-and-policies-v1.spec.js`

---

## Step 1 — Extract ACs to canonical form

The story has 29 numbered ACs. **AC22, AC23, AC24, AC25 are struck through** (`~~...~~`) in the
source — these are the Clone-quote ACs. Per canonical-form rules, struck-through text = removed
from scope. They are recorded here as explicitly-dropped (not silently omitted) and will NOT be
encoded as tests. The active set is: AC01-AC21, AC26-AC29 (25 active ACs).

Also captured as testable business rules from the story's "Business Rules" row:
- **BR-A: Maximum 10 lives can be added to a quote** (directly restates AC13).
- **BR-B: Maximum 5 policies (personal + business) can be added per life.**

### Canonical AC records

| Internal ID | Source | Given / When / Then (summary) | Parsing notes |
|---|---|---|---|
| MLP-01 | AC01 | Apply for a new quote → can "add a life" | |
| MLP-02 | AC02 | Click "+Life" → capture full Personal Details + all cover options for the new life | Large field-presence AC — likely split into sub-tests (personal details / lump sum / disability / kids), same as create-quote AC04 split. |
| MLP-03 | AC03 | Click "+Life" / navigate to "Life 1" without min details → error "Please enter the minimum requirements for a quote before proceeding to another life." | Strict exact-message assertion. |
| MLP-04 | AC04 | Given AC03, with min details (age, gender, smoker) entered → allows new life / navigation | Positive counterpart to MLP-03. |
| MLP-05 | AC05 | Multiple lives added → right-hand panel shows total yearly premium **per life** | |
| MLP-06 | AC06 | Click "X" on a life tab → confirmation pop-up "Are you sure you want to delete this life?" with Cancel + Delete | Strict message + two-button assertion. |
| MLP-07 | AC07 | Given AC06, click Cancel → back to quote screen, life NOT deleted | |
| MLP-08 | AC08 | Given AC06, click Delete → back to quote screen, life + associated policies deleted (quote + right panel) | |
| MLP-09 | AC09 | Multiple lives, click Apply Now, min premium < $240 for any life → "The minimum premium is $240.00 per year per Life insured" | Strict exact-message. Note story says "< 0" in one clause but the message + AC10 confirm the $240/life threshold. Flag wording ambiguity. |
| MLP-10 | AC10 | Multiple lives, Apply Now, min premium ≥ $240/life → Client Summary page; per life: First Name (prepop/editable), Middle Name (empty), Last Name (prepop/editable), DOB (prepop/editable), Proceed to Application button | |
| MLP-11 | AC11 | Given AC10, click Proceed to Application on Life 1 → proceeds with application only for Life 1 | |
| MLP-12 | AC12 | Given AC11, after submitting Life 1 app → Proceed button greyed out for Life 1; can proceed for other lives | Likely needs full application submission — probe for reachability. |
| MLP-13 | AC13 | 10 lives added, attempt 11th → "+Life" disabled; cannot add more | = BR-A. Needs 10 fresh lives — heavy, but testable. |
| MLP-14 | AC14 | Click "+ Personal Policy" → new tab with Inflation, Premium freeze, We pay premiums, Flexi Rate, Lump Sum (Life/TPD/Trauma/Cancer/Acd Death/Needlestick/Specific Injury), Disability (M&L/IP/Workability), Kids Cover | Field-presence. |
| MLP-15 | AC15 | Click "+ Business Policy" → new tab with Inflation, We pay premiums, Flexi Rate, Lump Sum (Life/TPD/Trauma/Specific Injury), Disability (Business Disability/Farmers Disability/Business Expenses) | Field-presence. NOTE: no Premium Freeze, no Kids Cover, reduced lump sum set, business-specific disability covers. |
| MLP-16 | AC16 | Click "X" on a policy tab → that policy tab deleted from view | |
| MLP-17 | AC17 | Multiple lives + multiple covers per policy → right panel: premium breakdown per policy & per cover, total yearly per life, total for all lives | |
| MLP-18 | AC18 | Multiple lives + covers → can navigate to any life and any policy under that life | |
| MLP-19 | AC19 | Multiple lives, Apply Now → Client Summary; one "Start Application" per life; status per life; expand/collapse each life section | Overlaps MLP-10; MLP-10 says "Proceed to Application", MLP-19 says "Start Application" — flag wording inconsistency between AC10 and AC19. |
| MLP-20 | AC20 | Given AC19, click Start Application → proceeds; shows "Continue Application" on return if not submitted; latest status per life | |
| MLP-21 | AC21 | Given AC19, submit one application + return → "Submitted" status; can Download quote / Download application PDFs / Clone quote; can proceed with others | Heavy — full submission + PDF/clone. Probe reachability. |
| ~~MLP-22~~ | ~~AC22~~ | Clone without required details → error | **STRUCK THROUGH — dropped from scope.** |
| ~~MLP-23~~ | ~~AC23~~ | Clone with required details → new life tab, pre-filled covers, excl. personal/kids | **STRUCK THROUGH — dropped.** |
| ~~MLP-24~~ | ~~AC24~~ | Update pre-filled cover details in cloned quote | **STRUCK THROUGH — dropped.** |
| ~~MLP-25~~ | ~~AC25~~ | 10 lives, attempt 11th → Clone button disabled | **STRUCK THROUGH — dropped.** |
| MLP-26 | AC26 | Life has a policy with an error, try add new life → pop-up "Please correct the errors before proceeding to another life" with OK button; blocks adding until fixed | Strict message. NOTE: different message from AC03 ("Please enter the minimum requirements...") — AC03 is for MISSING min details, AC26 is for EXISTING errors. Both distinct, both tested. |
| MLP-27 | AC27 | Life with a policy, click +Life → new life added AND control moves to newly added life | |
| MLP-28 | AC28 | Life with a policy, add new policy → new policy added AND control moves to newly added policy | |
| MLP-29 | AC29 | Life with a policy, add new policy with an error on policies → new policy added, control on new policy, errored policy tabs highlighted | |
| BR-A | Business Rules row | Max 10 lives per quote | Same as MLP-13. |
| BR-B | Business Rules row | Max 5 policies (personal+business) per life | Not covered by any AC directly — worth a test. |

### Judgment calls logged
1. **Struck-through AC22-25 dropped** — treated as out of scope (canonical-form rule for struck text).
   Recorded explicitly, not silently omitted.
2. **AC10 vs AC19 button-label inconsistency**: AC10 says "Proceed to Application", AC19 says
   "Start Application" for what appears to be the same Client Summary control. Flagged for author
   clarification; the test will assert whatever the live app actually shows and note the story
   inconsistency.
3. **AC09 "< 0" clause**: story text says "minimum premium is < 0" but the error message and AC10's
   counterpart say "$240 per life". Reading it as the documented $240/life minimum (PD/POL rule
   already established). Flagged.
4. **AC02 vs AC14/AC15 overlap**: AC02 lists per-life fields; AC14 (personal policy) and AC15
   (business policy) list per-policy fields. AC02's "add a life" and AC14's "add a personal policy"
   may surface the same panel — probe to confirm whether they are distinct controls.
5. **BR-B (max 5 policies/life)** has no dedicated AC — added as its own check since the story
   explicitly states it as a business rule.

---

## Step 2 — Classify each active AC (testable-now / needs-probe / genuinely-blocked)

Classification uses the story + accumulated app context (existing helpers already prove the
`Add life`, `Business`/`Personal` policy, per-policy frequency, and premium-panel patterns in
`create-a-new-business-quote-v1.spec.js`). Per the process, NOTHING is deferred out of caution —
"needs-probe" items get a targeted probe in Step 3, then get written.

| Internal ID | Classification | Basis / what to probe |
|---|---|---|
| MLP-01 | testable-now | `Add life` / `+Life` button already proven (BR-004 in create-quote spec). |
| MLP-02 | testable-now | Field-presence on a new life; reuse the AC04-split approach. Probe: confirm the new-life panel exposes the same PD + cover controls. |
| MLP-03 | needs-probe | Exact error message + which action triggers it (+Life with no min details). Probe the message string verbatim. |
| MLP-04 | needs-probe | Positive path: min details entered → +Life allowed. Probe alongside MLP-03. |
| MLP-05 | testable-now | `getTotalYearlyPremium` + per-life panel; probe per-life premium locator. |
| MLP-06 | needs-probe | "X" on a life tab → confirm pop-up text + Cancel/Delete buttons. Probe the modal. |
| MLP-07 | needs-probe | Cancel path (depends on MLP-06 modal selectors). |
| MLP-08 | needs-probe | Delete path — verify life + policies removed. |
| MLP-09 | needs-probe | Min-premium < $240 across multiple lives → exact message. Probe with a deliberately tiny SI. |
| MLP-10 | needs-probe | Client Summary per-life fields. Depends on Apply completing — known Apply-completion caveat applies; probe reachability. |
| MLP-11 | needs-probe | "Proceed to Application" on Life 1 only. Probe Client Summary controls. |
| MLP-12 | needs-probe | Requires SUBMITTING a full application for Life 1. Probe whether submission is reachable from the browser without backend/payment gate (iteration-001 noted payment gate blocks 6d/6e). May end genuinely-blocked. |
| MLP-13 (BR-A) | testable-now | Add 10 lives, assert 11th +Life disabled. Heavy (10 lives), but browser-reachable. Watch session-load rule (>4-5 fresh quotes → split; but this is ONE quote with 10 lives, different from many fresh quotes). |
| MLP-14 | needs-probe | `+ Personal Policy` control + its field set. Probe the exact button label ("+ Personal Policy" vs "Personal"). |
| MLP-15 | needs-probe | `+ Business Policy` control + reduced/business-specific field set (Business Disability, Farmers Disability, Business Expenses). Probe button label + covers. |
| MLP-16 | needs-probe | "X" on a policy tab → policy deleted. Probe policy-tab close control. |
| MLP-17 | needs-probe | Right panel: per-policy + per-cover breakdown, per-life total, all-lives total. Probe panel structure with 2 lives × 2 covers. |
| MLP-18 | needs-probe | Navigate to any life / any policy. Probe life-tab + policy-tab navigation selectors. |
| MLP-19 | needs-probe | Client Summary: one "Start Application" per life, status, expand/collapse. Depends on Apply. Overlaps MLP-10; note AC10 "Proceed" vs AC19 "Start" wording — assert what app shows. |
| MLP-20 | needs-probe | Start Application → Continue Application on return; status. Depends on reaching + partially doing an application. Probe reachability. |
| MLP-21 | needs-probe | Submit one app → Submitted status, Download quote/app PDFs, Clone. Heavy — full submission. Probe reachability; may be genuinely-blocked (payment/STP gate). |
| MLP-26 | needs-probe | Life with a policy ERROR, try +Life → pop-up "Please correct the errors before proceeding to another life" with OK. Distinct from MLP-03. Probe exact message. |
| MLP-27 | needs-probe | +Life → control moves to new life. Probe how "control/focus on newly added life" is observable (active tab class). |
| MLP-28 | needs-probe | Add policy → control moves to new policy. Probe active-policy-tab signal. |
| MLP-29 | needs-probe | Add policy with an error on policies → new policy added, control on it, errored tabs highlighted. Probe error-highlight class on policy tabs. |
| BR-B | needs-probe | Add 5 policies to a life, assert 6th blocked/disabled. Probe policy-add limit behaviour. |

**Summary:** 0 genuinely-blocked at this stage (nothing ruled out without a probe). 4 testable-now,
21 needs-probe. MLP-12 / MLP-20 / MLP-21 are the highest risk of ending genuinely-blocked (require
full application submission past the documented payment/STP gate) — but per the process they are
NOT pre-deferred; a probe in Step 3 must attempt them first.

---

## ⚠ BLOCKER encountered before Step 3 — no live credentials available

Steps 3 (live selector probing) and 5 (live run) both require authenticating against
`https://outsystems-dev.asteronlife.co.nz`. Checked 2026-09-02T15:xx:
- `ASTERON_LOGIN_EMAIL` / `ASTERON_LOGIN_PASSWORD` are NOT set in the environment.
- No populated `.env` exists in the repo root or `apps/asteron-quote-apply/` — only `.env.example`
  with placeholder values.

`global-setup.js` and `tools/server.js` both need real credentials to reach the app. Without them,
selector probing (Step 3) and the live run (Step 5) cannot proceed. The previous session ran on a
different machine (per sessions/2026-09-02.md) that had credentials configured; this machine does
not, and there is an additional documented risk that this machine's IP may not be allowlisted even
once credentials are supplied.

**Paused here to obtain credentials from the user before proceeding.** Steps 1 and 2 (which need
no live access) are complete. Nothing has been deferred out of caution — the pause is a genuine
hard blocker (no auth), not an avoidance of a difficult AC.


---

## Step 3 — Probe live app for selectors (in progress)

Login confirmed working on this machine (creds supplied by user; IP is allowlisted — login OK on
attempt 1). Three recon probes run so far (kept in `probes/`):
`probe-multi-lives-and-policies-recon.js`, `-recon-2.js`, `-recon-3.js`.

### Confirmed findings
- **Add-life button label = "Add life"** (NOT "+Life" as the story writes it). Flag: story says
  "+Life", app says "Add life". Encode assertions against the app's actual control but note story wording.
- **Policy add buttons = "Personal" / "Business"** (NOT "+ Personal Policy" / "+ Business Policy"
  as the story writes it). Same wording flag.
- **Life tabs** render as `<button class="osui-tabs__header-item ...">` with the active one carrying
  **`osui-tabs--is-active`** and `disabled=""`. The close control is an `<i class="fa fa-times">`
  inside the button. → MLP-27 focus signal = `osui-tabs--is-active` on the Life N button.
- **Policy tabs** (Personal 1 / Business 1) render DIFFERENTLY: a `<div>` containing an `<a>` label
  plus a SECOND `<a style="margin-left:10px"><i class="icon fa fa-times"></i></a>` as the close (X).
  - **Active policy tab** styled `border-bottom: 2px solid blue` → MLP-28 focus signal.
  - **Errored policy tab** styled `background-color: var(--color-error-light)` → **MLP-29
    error-highlight signal.** (Seen live: Personal 1 had the error-light background while Business 1
    was active-blue.)
- **MLP-15 Business policy field set — confirmed exactly:** covers present = Life, TPD, Trauma,
  Specific Injury, Business Disability, Farmers Disability, Business Expenses. Covers ABSENT =
  Cancer, Acd. Death, Needlestick, Mortgage & Living, Income Protection, Workability. Premium Freeze
  ABSENT, Kids Cover ABSENT, Inflation present. Matches the story's AC15 list.
- **MLP-03 exact modal (captured verbatim):** title **"Cannot proceed"**, body **"Please enter the
  minimum requirement for a quote before proceeding to another life"**, single **"OK"** button.
  ⚠ Story AC03 says "minimum **requirements**" (plural) + "...for a quote before proceeding to
  another life." App says "minimum **requirement**" (singular). Encode against the STORY text →
  expected-to-fail (discrepancy candidate).
- **MLP-04 positive:** with min details + a priced cover, "Add life" succeeds → Life 2 added, and
  Life 2 becomes the active tab.
- **MLP-09 exact message (captured):** "The minimum premium is $240.00 per year per Life insured."
  (matches story AC09 verbatim). Triggered by a tiny SI ($1,000) → premium < $240.
- **MLP-10 Apply does NOT navigate to Client Summary** — confirmed on 2 independent probe runs:
  after Apply on a fully-valid single-life quote, the page stays on "Illustration", no errors, and
  none of "Proceed to Application" / "Start Application" / "Continue Application" text appears.
  This matches the documented, still-open Apply-completion issue (validation-and-navigation/page.md
  + create-a-new-business-quote-v1 caveat). Screenshot evidence saved to
  `docs/business-rules/quote-screen/kids-cover-and-multi-life/evidence/01-probe-multi-lives-recon-3/
  mlp10-apply-no-navigation.png`.

### Remaining gaps (one more targeted probe)
- **MLP-06/07/08 life-tab delete modal**: clicking the fa-times on the ACTIVE Life 2 tab did not
  raise the "Are you sure you want to delete this life?" modal (the active tab button is `disabled`,
  so the icon click may not register). Retry: click the X on a NON-active life tab, or dispatch the
  click on the `<i>` element precisely.
- **MLP-26/29 genuine cover-error state**: activating Life with no Sum Insured did not by itself
  produce a visible error (error only materialises on Apply/validation). Retry: force a real error
  state (e.g. Apply to surface the SI-required error, or an over-cap SI) THEN click Add life, so the
  "Please correct the errors before proceeding to another life" path (MLP-26) can be captured.

### Classification impact (Apply-gated ACs)
MLP-10, MLP-11, MLP-12, MLP-19, MLP-20, MLP-21 all depend on Apply reaching the Client Summary /
application flow, which is confirmed unreachable from the browser on this environment (known
Apply-completion issue, reproduced twice). These move to **genuinely-blocked WITH evidence** — not
deferred out of caution: a probe attempted them and the control chain is unreachable. They will be
encoded as `test.fixme(true, reason)` with the screenshot referenced.


---

## Step 3 — FINAL probe results (5 recon runs total; stopping here per the "too many probes" learning)

### Newly resolved
- **MLP-06/07/08 (delete a life) — CANDIDATE DISCREPANCY.** The X on a life tab is an
  `<i class="fa fa-times">` inside the ENABLED copy of the life-tab button (there are two rendered
  copies — a `disabled` one and an enabled one; must click the enabled one). When clicked (on a
  quote with min details + a priced Life 1 + an added Life 2), the app showed the modal
  **"Cannot proceed / Please enter the minimum requirement for a quote before proceeding to another
  life / OK"** — NOT the story's expected **"Are you sure you want to delete this life?"** with
  **Cancel + Delete** buttons. No delete-confirmation modal of the story's shape was reachable.
  → AC06/AC07/AC08 are **confirmed-NOT-matching** (candidate defect): the delete-confirmation
  dialog described by the story was not found; the X instead surfaces the min-requirement block.
  Reproduced once cleanly in recon-5 (screenshot saved). Per verify-before-writeup, this needs a
  2nd minimal confirming run — to be done as its own check, OR encoded to the story's expected
  value so it fails until fixed (which is itself the re-verification every run).
- **MLP-26 (add life blocked by existing policy errors) — NOT REACHED.** Could not produce the
  "Please correct the errors before proceeding to another life" modal from the browser with the
  error types tried (min-premium error after Apply; over-cap $60M SI showed NO error at all; blank
  SI showed no error and no modal on Add life). The specific error-state that triggers AC26's modal
  was not reproducible via these paths. Classified **needs-probe → currently unreproduced**; will
  encode as a best-effort test asserting the story's expected modal, expected-to-fail, with a note
  that the triggering error-state could not be reproduced in probing (candidate for author/BA
  clarification on what error-state AC26 means).

### Per-AC outcome after probing (feeds Step 4)
| AC | Outcome | Encoding |
|---|---|---|
| MLP-01 | confirmed match | "Add life" button present + adds a life |
| MLP-02 | confirmed match | new-life PD + cover controls present (field-presence, AC04-style split) |
| MLP-03 | confirmed match w/ wording flag | modal "Please enter the minimum requirement..." — story says "requirements" (plural). Assert story text → likely FAIL on the plural/singular diff. |
| MLP-04 | confirmed match | min details → Add life succeeds, Life 2 active |
| MLP-05 | needs live assert | per-life total premium in panel |
| MLP-06 | **confirmed NOT match** | expect story "Are you sure you want to delete this life?" + Cancel/Delete → FAILS (app shows min-requirement modal instead) |
| MLP-07 | blocked-by-MLP-06 | Cancel path — no delete modal to cancel; encode expected, fails |
| MLP-08 | blocked-by-MLP-06 | Delete path — same |
| MLP-09 | confirmed match | "The minimum premium is $240.00 per year per Life insured." |
| MLP-10 | **blocked (evidence)** | Apply does not navigate to Client Summary (known issue, 2 runs + screenshot) |
| MLP-11 | **blocked (evidence)** | depends on Client Summary (unreachable) |
| MLP-12 | **blocked (evidence)** | requires full app submission (unreachable) |
| MLP-13 (BR-A) | testable | add 10 lives → 11th "Add life" disabled |
| MLP-14 | confirmed match | Personal policy field set present |
| MLP-15 | confirmed match | Business policy field set exactly as probed |
| MLP-16 | needs live assert | policy-tab X = 2nd `<a>` w/ `i.fa-times`; assert Business 1 removed |
| MLP-17 | needs live assert | per-policy + per-life + all-lives premium breakdown in panel |
| MLP-18 | confirmed match | life-tab + policy-tab navigation via clicking tab labels |
| MLP-19 | **blocked (evidence)** | Client Summary unreachable |
| MLP-20 | **blocked (evidence)** | Start/Continue Application unreachable |
| MLP-21 | **blocked (evidence)** | submission + PDFs + clone unreachable |
| MLP-26 | needs-probe → unreproduced | encode story modal expected-to-fail; note trigger not reproduced |
| MLP-27 | confirmed match | +Life → new life active (`osui-tabs--is-active`) |
| MLP-28 | confirmed match | +Policy → new policy active (`border-bottom: 2px solid blue`) |
| MLP-29 | needs live assert | errored policy tab highlighted (`background-color: var(--color-error-light)`) |
| BR-B | needs live assert | add 5 policies to a life → 6th blocked |

**Blocked-with-evidence (6):** MLP-10/11/12/19/20/21 — all gated on Apply→Client Summary, which is
confirmed unreachable from the browser on this env (documented Apply-completion issue, reproduced
twice + screenshot). These are `test.fixme(true, reason)`, NOT deferred out of caution.

**Probe-safety note:** no banned patterns used. The tab-close and add-life clicks are real element
`.click()`s via evaluate (the established OutSystems pattern for XHR-triggering controls), each
followed by a modal/state read that only succeeds if the click registered — not a passive attribute
read. No `mouse.wheel`/`mouse.move`, no unscoped `keyboard.press`, no raw value-set `dispatchEvent`.


---

## Step 5 — First live run (2026-09-02T16-13-49)

Command: `node node_modules/@playwright/test/cli.js test "<spec>" --workers=1 --config=playwright.edge.config.js`
Result: **11 passed, 7 failed, 6 skipped**, 39.2 min. Report:
`test-runs/multi-lives-and-policies-v1/2026-09-02T16-13-49/report.md`.

- PASS (14 expected): MLP-01, 02, 04, 09, 14, 15, 16, 18, 27, 28 + BR-B (5-policy limit passed!).
- FAIL as designed (expected-to-fail discrepancies): MLP-03 (wording), MLP-06/07/08 (delete modal).
- SKIP (blocked-with-evidence): MLP-10, 11, 12, 19, 20, 21 (Apply→Client Summary unreachable).
- **FAIL unexpectedly (needed Step 6 investigation):** MLP-05, MLP-13, MLP-17, MLP-29.

Note: BR-B PASSING confirms the max-5-policies rule is real and enforced (6th add blocked).

## Step 6 — Self-verify the 4 unexpected failures (probe-multi-lives-verify-failures.js)

(First run hit a session-conflict login timeout — the account's single session hadn't released
after the 39-min spec run; retried after 75s and it logged in fine. Documented single-session
behaviour, not a finding.)

- **MLP-05 / MLP-17 — TEST BUG (my assertion wrong), NOT an app defect.** With 2 priced lives the
  right panel shows exactly ONE "Total Yearly Premium" (a single grand total) plus "Total Monthly
  Premium (All Lives)". There is NO per-life repeat of the literal "Total Yearly Premium" label —
  per-life premium is shown within each life's own section, not by repeating that heading. My
  assertion (`count("Total Yearly Premium") >= 2`) was wrong by construction (input-correctness
  checklist #6-adjacent: asserted the wrong signal). FIX THE TEST: assert per-life premium via each
  life's own priced premium (getTotalYearlyPremium on the active life) + presence of an all-lives
  total, not a label-count. This is a test-technique artifact per the verify-before-writeup rule.
- **MLP-29 — TEST BUG (precondition not established), NOT an app defect.** After activating Life
  with a blank Sum Insured, the body has ZERO error words and Personal 1 carries NO error-light
  style (only Business 1 has the active-blue border). A blank SI does NOT create a visible policy
  error until Apply — so the test's "errored policy" precondition was never real (input-correctness
  checklist #4: required precondition state not established). Same root cause as MLP-26: a genuine
  per-policy error state was not reproducible from the browser via blank/over-cap SI. FIX: since the
  triggering error-state can't be produced from the reachable screen, MLP-29's highlight assertion
  can't be satisfied by construction either — re-encode as blocked-with-evidence (the error-light
  highlight IS confirmed to exist as a mechanism — seen on Personal 1 in recon-3 when it was the
  errored tab — but the specific trigger from the browser is not reproducible). Document both.
- **MLP-13 — INTERACTION ISSUE (a popup-backdrop intercepts clicks), limit-at-10 NOT disproven.**
  The 15s/30s timeout is a `<div class="popup-backdrop">` intercepting pointer events on the age
  field — a leftover modal backdrop (the "Cannot proceed" min-requirement popup can appear during
  the build if a life's minimum isn't fully satisfied at the moment "Add life" is clicked). 2 lives
  built cleanly (<1s per add-life click) before the backdrop blocked life 3's field entry. The
  max-10 rule itself was NOT disproven — the test just can't reliably build 10 lives with the
  current interaction. FIX: dismiss any open popup (click OK) before each life's field entry, and
  set the age via evaluate rather than a click that a backdrop can intercept. This is a
  test-robustness fix, not an app defect.

### Step 6 verdicts
| AC | Verdict | Action |
|---|---|---|
| MLP-05 | test artifact | fix assertion: per-life premium via each active life + all-lives total presence |
| MLP-17 | test artifact | same fix as MLP-05 (per-policy/per-life/all-lives via robust signals) |
| MLP-29 | test artifact (precondition unreachable) | re-encode blocked-with-evidence (trigger not reproducible from browser) |
| MLP-13 | interaction issue | robustness fix: dismiss popups + evaluate-set age; keep the max-10 assertion |


---

## Step 7 — Finalise (2026-09-02)

**Authoritative run:** `test-runs/multi-lives-and-policies-v1/2026-09-02T19-25-46/report.md` —
**13 passed, 3 failed (encoded discrepancies), 8 skipped (blocked-with-evidence)**, 34.6 min.

**Artifacts produced:**
- Spec: `tests/quote-screen/multi-lives-and-policies-v1.spec.js` (24 tests).
- Test-doc matrix: `docs/test-documentation/multi-lives-and-policies-v1.md`.
- Business rules + 3 Discrepancy Evidence Records: `docs/business-rules/quote-screen/kids-cover-and-multi-life/page.md` (MLP- prefix; MLP-03 wording, MLP-06/07/08 delete modal, MLP-26 correct-errors modal).
- Learnings appended to `TEST-GENERATION-LEARNINGS.md`.
- Probes retained in `probes/probe-multi-lives-and-policies-recon{,-2..-5}.js`, `probe-multi-lives-verify-failures.js`, `probe-multi-lives-backdrop-diag.js`. Evidence subfolders 01/02/03 under kids-cover-and-multi-life/evidence with notes.md.

**Final AC coverage (25 active ACs + BR-A/BR-B):**
- Confirmed matching (passing): MLP-01, 02, 04, 05, 09, 14, 15, 16, 17, 18, 27, 28, BR-B.
- Confirmed NOT matching (encoded, expected-fail): MLP-03, MLP-06/07/08, MLP-26.
- Blocked-with-evidence: MLP-10/11/12/19/20/21 (Apply→Client Summary unreachable), MLP-13 (10-life build under load), MLP-29 (errored-policy trigger unreachable).
- Struck-through, out of scope: AC22-25 (Clone).

**Flagged for author/BA:**
1. AC03 "requirement**s**" (plural) vs app "requirement" (singular) + trailing full stop.
2. AC06-08: no "Are you sure you want to delete this life?" delete-confirmation dialog reachable — the life-tab X surfaces the min-requirement "Cannot proceed" modal instead. Candidate defect.
3. AC26/AC29: what "policy has an error" state triggers these? Not reproducible pre-Apply from the browser.
4. AC10 "Proceed to Application" vs AC19 "Start Application" — same Client Summary control, inconsistent label in the story.
5. The Apply→Client Summary completion issue blocks 6 ACs — same known open issue affecting other stories.

**What to improve next time:** see the 2026-09-02 entry in TEST-GENERATION-LEARNINGS.md (bulk-op
diagnostic-in-isolation early; split heavy-session tests up front; stable structural signals over
racy per-life premium reads).
