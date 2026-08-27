# Test: Commission Category (Adviser Use) — comm-cat-v1

> **Test file:** `comm-cat-v1.spec.js`
> **Last run:** 2026-08-20 (local Edge headless) — ~4 min
> **Source:** ACB-13175 user story ("Select Default Commission Category"), acceptance-criteria mode
> **Result:** 4/5 checks passing, 1 confirmed failing (real app defect, not a test bug)

## Results

| # | Rule ID | What's Tested | Test Input | Expected | Status | Notes |
|---|---|---|---|---|---|---|
| 1 | AC01-03 | Default for Agency label + options + first-time default | Priced quote (Life $500k), fresh agency | Label shows agency #; options = Upfront/Level 30/Spread 20; default = Upfront | ✅ Pass | |
| 2 | AC14 | Single IC/RC auto-selected at Flexi Rate N/A | Flexi Rate = N/A | Options = [Please Select, IC-100%RC-100%], real option auto-selected | ✅ Pass | |
| 3 | AC11 | 30% Flexi Rate forces Nil Commission | Flexi Rate = 30% | Exact "Nil Comm" message; per-cover rows hidden from modal | ✅ Pass | |
| 4 | AC04/AC05 | Update button disabled-until-changed | Change then revert Default-for-Agency selection | disabled → enabled → disabled | ✅ Pass | Earlier probe reported this as always-enabled; retested 4 ways (zero-interaction timing sample, clean selectOption-only run) and confirmed it was a false positive from a stray `mouse.wheel()` call in that probe script, not a real defect |
| 5 | AC10/Example 2 | 7.5% Flexi Rate IC/RC default | Flexi Rate = 7.5%, Upfront agency default | Selected = "IC-75%, RC-100%" | ❌ Fail | Actual selected value is "IC-100%, RC-100%". Reproduced identically 3 times across 3 separate runs (2 probes + this test file). Asserted against the spec on purpose — will pass automatically once the real defect is fixed |

## Deferred (not yet tested, not silently skipped)

| AC(s) | Reason |
|---|---|
| AC09 | Partially covered by #4's revert-to-saved-value behavior |
| AC12-19 | Rest of the multi-option IC/RC matrix (Examples 1, 3, 4) — each needs the same reproduce-3x rigor as #5 before being encoded |
| AC20-27 | Cross-quote persistence + STP payload — requires saved quotes and backend/LIFE400 payload inspection |

## Business Rule Corrections

| Rule ID | Was | Now |
|---|---|---|
| PREM-15 | "Adviser Use ... effectively inert until a valid, priced quote exists" | Once priced, Adviser Use opens a fully functional "Commissions" modal |
