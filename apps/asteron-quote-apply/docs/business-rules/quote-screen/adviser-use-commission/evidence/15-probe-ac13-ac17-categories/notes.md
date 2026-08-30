# 15 — probe-ac13-ac17-categories (Adviser Use per-cover / Select All category controls)

- **Date/time:** 2026-08-31 ~08:30
- **Command:** `node apps/asteron-quote-apply/probes/probe-ac13-ac17-categories.js`
- **Persona/quote:** Age 35, Male, OCC AA, Life $500k.
- **Goal:** Confirm AC13 (Adviser Use screen defaults for an invalid default+FR combo) and AC17
  (per-benefit category selection when a FR supports multiple categories) are reachable and match.

## AC13 — Spread 20 default + Flexi Rate 2.5% (Spread 20 is NOT valid for 2.5%)

> **IMPORTANT — two readings, native is authoritative.** The FIRST probe run set Default = Spread 20
> via raw `dispatchEvent('change')` and showed IC/RC = "Please Select" with the category pick lists
> DISABLED (matching AC13). A follow-up run set Default = Spread 20 via **native `selectOption`**
> (matching the test's `setDefaultAgency`, which triggers the full OutSystems reactive recalc) and
> showed a DIFFERENT, contradictory result — the app **auto-selects IC-75%, RC-100%** and immediately
> **enables** the per-cover category showing **Level 30**. The `.spec.js` test (native path) reproduces
> the native reading on 2 consecutive runs. Per the steering "raw dispatchEvent artifact" rule, the
> native reading is authoritative and the dispatchEvent reading was a false positive. **AC13 is therefore
> a CONFIRMED DISCREPANCY, not a match.**

**Native-selectOption reading (authoritative), BEFORE picking an IC/RC:**
- Select IC/RC: enabled, selected = **"IC-75%, RC-100%"** (auto-selected — should be "Please Select" per AC13),
  options = `["Please Select","IC-100%, RC-50%","IC-75%, RC-100%"]`.
- Select All: **enabled**, options = `["Please Select","Level 30"]` (should be disabled per AC13).
- Life Cover: **enabled**, selected = **"Level 30"**, options = `["Please Select","Level 30"]` (should be disabled per AC13).

**AFTER picking IC-100%, RC-50%:** Select All / Life Cover options = `["Please Select","Upfront"]`
(the "only the associated category" part of AC13 does hold once an IC/RC is chosen).

→ **AC13 CONFIRMED NOT MATCHING** — the app does not gate the category pick lists behind a manual
IC/RC selection; it auto-selects an IC/RC (IC-75%, RC-100% → Level 30) even though Spread 20 (the
default) is invalid for 2.5%. Encoded as an expected-to-fail assertion in the spec.

## AC17 — Flexi Rate 15% (supports multiple categories), after picking IC-50%, RC-50%

- Select IC/RC options at 15% = `["Please Select","IC-0%, RC-100%","IC-100%, RC-0%",
  "IC-50%, RC-50%","IC-100%, RC-50%"]`.
- After picking IC-50%, RC-50%:
  - Select All: **enabled**, options = `["Please Select","Level 30","Spread 20","Upfront"]`.
  - Life Cover (per-cover): **enabled**, options = `["Please Select","Upfront","Level 30","Spread 20"]`
    — all three commission categories selectable for the benefit. ✅
  (Matches the story Example 3: "The user can select UPFRONT or LEVEL30 OR SPREAD20 against the
  covers when IC-50%, RC-50% is selected.")

→ **AC17 CONFIRMED MATCHING.**

## Notes on technique

- **Lesson (raw dispatchEvent artifact):** setting the Default-for-Agency select via raw
  `dispatchEvent('change')` produced a "Please Select / categories disabled" reading for AC13 that
  did NOT reproduce under native `selectOption` (the realistic user action) — the native path
  auto-selects IC-75%, RC-100% and enables Level 30. Always drive OutSystems selects that feed a
  reactive recalc via native `selectOption`, and reconcile any dispatchEvent reading against it
  before writing a finding.
- Both ACs are reachable entirely on the Adviser Use screen with the Default-for-Agency dropdown
  set to Spread 20 in-quote — no `Update`/save and no Apply required. AC17 CONFIRMED MATCHING;
  AC13 CONFIRMED NOT MATCHING (see above).
