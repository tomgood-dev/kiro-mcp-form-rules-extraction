# Parity Audit — Our Automated Specs vs Client Manual Test Suite

- **Date:** 2026-09-09
- **Our suite:** `apps/asteron-quote-apply/tests/quote-screen/*.spec.js` (see `test-runs/DASHBOARD.md`)
- **Client reference:** `reference/client-manual-test-suite/` — OneDrive_2 (2017-era business-rules
  walkthroughs), OneDrive_3 (2025-26 test-case workbooks + TC mapping tracker), OneDrive_4 (test
  **execution** evidence — one file per TC, verdict in the filename: `Pass -`, `Fail_`, `Issue -`,
  `Defect retest`).
- **Method:** harvested every client TC#, its AC mapping, and its pass/fail verdict from the execution
  filenames (index: `apps/asteron-quote-apply/probes/exec-index.txt`), then crosswalked to our specs.
  Bulky files not opened individually — filenames + the OneDrive_3 test-case workbooks carry the detail.
- **Legend:** ✅ both cover · 🟦 only client · 🟨 only us · ⚠️ discrepancy/defect to reconcile · 🔓 we
  deferred it but the client proves it's reachable (un-defer).

## Executive summary

1. **Coverage is broadly aligned**, and on the pure lump-sum covers (TPD, Trauma, Cancer, Kids) our
   automation is **as complete or broader** than their manual execution evidence.
2. **Several of our deferrals are now un-deferrable** — the client executed them (so they're reachable),
   and their materials supply the data we said we lacked:
   - **Occupational Codes**: the whole IC / eligibility / employment-status / **premium-change popup**
     (our deferred AC27-29) / named-occupation→code set — client ran TC_1–TC_58, mostly Pass.
   - **Loadings AC07** (Per-MILE >$20 boundary) — client TC_8/TC_9 executed it (Pass). We deferred it
     as a per-mille entry limitation.
   - **Business Specific Injury AC13** (MLC option greyed-out) — client marked it **Pass**; we deferred
     it pending a DOM probe.
3. **The client found real DEFECTS we should ensure our specs catch** (independent corroboration):
   - Occupational Codes **TC_9/TC_10/TC_11 = Fail** (TPD eligibility U/M/A) + defect **ACB-10785**.
   - Enter Commissions **12 Fail TCs** (Flexi Rate NA/2.5/5/7.5/12.5/15/17.5%, save, IC/RC@15, 30%,
     OK/Cancel buttons) + retests ACB-10045/10813/10247/9972.
   - Bundled Discounts defects **ACB-10056 / 9946 / 9947 / 9981 (L400)**, "Farmers not eligible for
     bundling", "premium panel shows $0 on adding Farmers Disability".
   - Multi Lives defects **ACB-9428 / 9613 / 9607** (delete-life AC06, proceed-to-application AC10,
     error-message AC3, business-copy-default).
4. **The client has finer sub-case granularity** than us in Bundled Discounts (AC02.1…AC04.3, remove-
   cover, same-cover-no-discount, PER+BUS combos, tooltip) and Enter Commissions (every Flexi Rate value).
5. **Our Kids min-age boundary gap stands** (we test >21 max but not <1 min) — independent of the client.

## Per-feature crosswalk

### Occupational Codes — our `occupational-codes-v1` (5 pass / 1 fail / 2 deferred) vs client TC_1–TC_58
| Area | Client | Us | Status |
|---|---|---|---|
| Code list AA/AM/A1/A2/B/C/S/U/IC | TC_3 Pass | AC01-04 ✅ | ✅ |
| Quote on code-only / no-code per cover | TC_5, TC_42-51 Pass | AC05 (Life only) | 🟦 client covers per-cover (Life/Trauma/Cancer/Acd/TPD); we do Life only |
| TPD + code U → not eligible | TC_9 **Fail (defect)** | AC08 ✅ | ⚠️ **client says this FAILS** — verify our AC08 asserts the correct expected + would catch the defect |
| TPD 'M' only Modified / 'A' disallows Own | TC_10/TC_11 **Fail** | — | ⚠️🟦 defects we don't cover — add |
| IC individual-consideration (TPD/Life/Trauma/IP, per cover) | TC_12-16, TC_52-58 Pass | AC11 (TPD, our expected-fail typo), AC12 (Life) | ⚠️ we found TPD msg typo "required"; client marks Pass → reconcile wording; add Trauma/IP/per-cover |
| IP 'S' restrictions (benefit 2yr/wait 90d) | TC_21-24 Pass | — deferred | 🔓 un-defer |
| IP 'U' blocks business disability/farmers | TC_26-28, TC_31 Pass | — deferred | 🔓 un-defer |
| Employment-status 'Other' / Farmers self-emp | TC_19-20, TC_29-30 Pass | — deferred | 🔓 un-defer |
| Farmers $10k monthly-benefit boundary triple | TC_32-34 Pass | — deferred | 🔓 un-defer |
| **Premium-change popup (Yes/No/boundary)** | TC_35-38 Pass | — **deferred AC27-29** | 🔓 **un-defer — client proves reachable** |
| Needlestick NA / SIB 'U' blocks | TC_17/TC_18 Pass | — deferred | 🔓 un-defer |
| Required-field combos (TPD/SI/Workability) | TC_39-41 Pass | AC31 (TPD) partial | 🟦 add SI + Workability field-combos |
| Occupation loadings raise premium | TC_6 **Issue**, TC_7 Pass | — deferred | ⚠️🔓 un-defer + note client Issue |
| Named-occupation → code (Surgeon→AM, etc.) | TC_4 Pass (TELFR_OCCUPATION.xlsx) | — deferred (said "no names→codes ref") | 🔓 **un-defer — reference now available** |
| Code → L400 submission | TC_8 (backend/trace) | — | 🟦 backend — stays deferred (out of browser scope) |

### Enter Commissions — our `enter-commissions-v1` (5 pass / 1 fail / AC08 discrepancy) vs client
| Area | Client | Us | Status |
|---|---|---|---|
| Select commission type / window / Default-for-Agency / Select-All / prem-struct | TC01-05 AC01-05 Pass | covered | ✅ |
| Flexi Rate values NA/2.5/5/7.5/10/12.5/15/17.5% | TC01-08 **Fail** | partial | ⚠️🟦 client shows these FAIL — add the per-value sweep + verify we'd catch |
| Flexi Rate 20/22.5/25/27.5% | Pass | — | 🟦 add |
| AC06 save all commission details | **Fail** | — | ⚠️🟦 defect — add |
| AC08 FlexiRate selected on quote | Pass | our **discrepancy** (IC/RC auto-select) | ⚠️ reconcile: our AC08 expected-fail vs their Pass |
| AC09 IC/RC @ FlexiRate 15 | **Fail** | — | ⚠️🟦 add |
| AC11 FlexiRate 30% | **Fail** | — | ⚠️🟦 add |
| Tooltip / Cancel / add PER+BUS policies | TC12-15 Pass | partial | 🟦 |

### Bundled Discounts — our `discounts-bundling-v1` (4 pass / 2 fail) vs client TC01-27
| Area | Client | Us | Status |
|---|---|---|---|
| 2/3/4-cover bundling thresholds (PER, BUS, PER+BUS) | TC01,04,07,10,11,14,18,21 Pass | partial (our 12.5/17.5 discrepancy) | ⚠️ our known QA discount % discrepancy stands |
| Same-cover-no-discount (AC02.1/02.2/03.2/03.9) | TC02,03,12,19 | — | 🟦 add negative sub-cases |
| Below-min-SI no-discount (AC02.4-02.8, 03.5-03.10) | TC05,06,09,15,17,20 | partial | 🟦 add |
| Remove-cover recalculation (AC04-04.3) | TC22-25 | — | 🟦 add |
| Tooltip validation (AC06/06.1) | TC26-27 Pass | — | 🟦 add |
| Defects: L400 multi-policy fail, farmers-not-eligible, $0 panel | ACB-9981/10056/9946/9947 | — | ⚠️🟦 verify our spec catches / expected-fail |

### Loadings — our `enter-loadings-v1` (0 pass / 2 fail, AC07 deferred) vs client TC_1-20
| Area | Client | Us | Status |
|---|---|---|---|
| Loadings pop-up structure / % dropdown / per-cover | TC_1-5 Pass | AC01-04,06,09 | ✅ |
| **Per-MILE >$20 error + $20.00 boundary accept** | TC_8/TC_9 Pass | **deferred AC07** | 🔓 **un-defer — client executed it** |
| Per-MILE rounding / arrow keys / validation | TC_6,7,19 | — | 🟦 add |
| AC05 / AC10 | **Fail** | our 2 fails | ⚠️ reconcile — likely same defects |
| Per-life / propagate-to-policies | TC_17,18 | — | 🟦 add |

### Standalone TPD (ACB-7090) — our `personal-standalone-tpd-cover-v1` (20 pass)
Client TC01-21 (age/premium-structure boundaries, SI>250k @17-21, SI>5M combos, definition-not-modified),
all Pass. **Strong parity; our automation matches or exceeds.** ✅

### Standalone Trauma (ACB-7089) — our `personal-lump-sum-trauma-v1` (30 pass / 2 skip)
Client TC01-11 → AC06-10, AC25-27 (age/SI/TPD-on-Trauma). Covered by us. ✅

### Business Specific Injury — our `business-specific-injury-cover-v1` (0 pass / 1 fail)
Client AC01-13 **all Pass, incl. AC13 "option greyed out"** + AC12 (video). We **deferred AC13** pending a
DOM probe. 🔓 **un-defer AC13** — client proves the greyed-out state is observable.

### Multiple Lives & Policies — our `multi-lives-and-policies-v1` (15 pass / 3 fail / 8 skip)
Client TC1-11 + defects **AC06** (delete life), **AC10** (proceed-to-application vs continue), **AC3**
(error message) + ACB-9428/9613/9607. Our spec already has 3 fails/8 skips — ⚠️ reconcile our fails against
their defect list; confirm we catch the same three.

### Clone Quote — our `clone-quote-v1` (full deferral: no submitted app)
Client TC01-17 executed **against real submitted apps** (Cosmos_submitted/cloned, J-numbers), incl. birthday-
lock single/multi (TC12-14), data-mapping (TC03), sensitive-data-not-carried (TC16), Apply-Now-quote-only
(TC17). 🔓 **un-deferrable IF we get a submitted-application fixture** on a test account (the blocker is data,
not reachability — the client had submitted apps).

### Workability — our `personal-disability-workability-v1` (1 pass)
Client AC01-12 incl. AC06/AC12 monthly-benefit cap (retested), AC07 age>61, AC08 IP/MLC conflict, AC09
business-disability conflict, AC12 inflation+increasing-claim. 🟨/🟦 our spec is thin (1 test) vs their AC
sweep — **expand to match**.

### Needlestick — our `lumpsum-needlestick-cover-v1` (10 pass / 1 fail)
Client TC72-78 + eligibility + occupation list. Overlaps our spec; ⚠️ reconcile our 1 fail.

### Early Trauma — our `early-trauma-benefit-v1` (1 pass / 1 deferred, SI→PDF/L400)
Client evidence = **application-ID results per policy** (backend). Confirms our deferral was correct: the SI
is verified in the backend/app-ID, not the quote screen. ✅ (deferral justified)

### Kids Cover — our `kids-cover-v1` (6 pass) vs client (AC05 + AC09 only, + retest)
Our automation is **broader** than their execution evidence here. **Gap (ours, from OneDrive_2 CLNZ-771):**
min-age boundary (kid <1 → "The minimum age next birthday for Kids Cover is 1") — we only test the >21 max.

## Prioritized action list

**P1 — un-defer things the client proved reachable (highest value, converts skips → real tests):**
1. Occupational Codes: premium-change popup (AC27-29), IP 'S'/'U' eligibility, employment-status, Farmers
   $10k boundary, named-occupation→code (use TELFR_OCCUPATION.xlsx mappings), IC per-cover. Big expansion.
2. Loadings AC07: Per-MILE $20 boundary-accept + >$20 error (client TC_8/TC_9).
3. Business Specific Injury AC13: MLC greyed-out (client Pass).

**P2 — verify our specs catch the client's confirmed defects (regression safety):**
4. Occupational TPD U/M/A (TC_9/10/11 Fail) — add + assert as expected-fail vs the correct rule.
5. Enter Commissions Flexi-Rate failures (TC01-11, AC06/09/11) — add per-value sweep.
6. Bundled Discounts L400 / farmers-not-eligible / $0-panel defects.
7. Multi-Lives AC06/AC10/AC3 defects — confirm our 3 fails are these.

**P3 — granularity gaps (match client sub-cases):**
8. Bundled Discounts: same-cover-no-discount, below-min-SI, remove-cover, tooltip, PER+BUS combos.
9. Workability: expand to full AC01-12 sweep.
10. Kids Cover: add min-age (<1) boundary.

**P4 — reconcile discrepancies (confirm with BA, don't blind-fix):**
11. Enter Commissions AC08 (our expected-fail vs their Pass).
12. Bundling discount % (our 12.5/17.5 vs story 15/20) — is the client seeing the same?
13. Occupational TPD-IC "required" vs "requires" wording (our expected-fail; client marks Pass).

**Blocked (data/environment, not reachability):**
- Clone Quote — needs a submitted-application fixture.
- Early Trauma SI, Occupational L400 submission — backend/PDF, out of browser scope.

## Notes on standards alignment
The client's test-case shape (`TCID | Summary | Description | Action | Expected Result | Priority | Label |
Test Type` in OneDrive_3; `Test Case | AC | Action | Expected | Pass/Fail | Comments` in OneDrive_2) maps
1:1 onto our AC-annotation + `recordCheck(expected/actual)` + status. **No format change needed.** The two
worth adopting for traceability: (a) reference the **ACB Jira ID** and the client **TC#** in our spec/doc
so a BA can line them up; (b) mirror their **AC sub-numbering** (AC02.1, AC03.7) where we add the finer
bundling/commission sub-cases.
