# Test: Commission Category Modal Defaults & Update Button — commission-category-modal-defaults-and-update-button-v1

> **Test file:** `commission-category-modal-defaults-and-update-button-v1.spec.js`
> **Last run:** 2026-08-21 (local Edge headless) — ~4 min, 4 fresh quotes
> **Source:** ACB-13175 user story ("Select Default Commission Category"), acceptance-criteria mode
> **Result:** 4/4 checks passing

## Results

| # | Rule ID | What's Tested | Test Input | Expected | Status | Notes |
|---|---|---|---|---|---|---|
| 1 | AC01-03 | Default for Agency label + options + first-time default | Fresh quote, priced Life $500k | Label shows agency #; options = Upfront/Level 30/Spread 20; default = Upfront | ✅ Pass | |
| 1b | AC14 | Single IC/RC auto-selected at Flexi Rate N/A | Same quote as #1 | Options = [Please Select, IC-100%RC-100%], real option auto-selected | ✅ Pass | |
| 2 | AC11 | 30% Flexi Rate forces Nil Commission | Fresh quote, Flexi Rate = 30% | Exact "Nil Comm" message (shown only after opening Adviser Use — the AC's trigger is "navigates to the Adviser Use page", not selecting the rate); per-cover rows hidden | ✅ Pass | v1 checked the message on the main page before opening Adviser Use — worked there because that quote had already opened Adviser Use earlier at N/A. Fixed by opening Adviser Use first. |
| 3 | AC04/AC05 | Update button disabled-until-changed | Fresh quote, change then revert Default-for-Agency selection | disabled → enabled → disabled | ✅ Pass | |
| 4 | ADV-08 | Example 1: 2.5% Flexi Rate IC/RC default | Fresh quote, Flexi Rate = 2.5% | Options = [Please Select, IC-100%RC-50%, IC-75%RC-100%]; selected = IC-100%,RC-50%; Life Cover row = Upfront | ✅ Pass | |

## Split from comm-cat-v2 (2026-08-21)

Originally one 7-part file opening 7 fresh quotes in a single session. That sustained more session load than any other test in this suite and correlated with two real instability events (a 15-minute hang on the 7th fresh quote; a forced mid-test logout on the 3rd). Splitting into this file (Parts 1-4) and `commission-category-flexirate-icrc-examples-v1` (Parts 5-7) halves the load per session — both ran clean end-to-end after the split, with no retries needed. See `evidence/` runs 08-11 for the investigation.

## Deferred (not yet tested, not silently skipped)

| AC(s) | Reason |
|---|---|
| AC06-08 | Save/persist flow — requires clicking Update, which mutates the agency-wide default shared with other users of this dev environment |
| AC09 | Partially covered by #3's revert-to-saved-value behavior |
| AC12/13/15-19 | Rest of the multi-option IC/RC matrix — see `commission-category-flexirate-icrc-examples-v1.md` for Examples 2-4; the 9 remaining non-named Flexi Rate values are not yet covered |
| AC20-27 | Cross-quote persistence + STP payload — requires saved quotes and backend/LIFE400 payload inspection |

## Business Rule Corrections

| Rule ID | Was | Now |
|---|---|---|
| PREM-15 | "Adviser Use ... effectively inert until a valid, priced quote exists" | Once priced, Adviser Use opens a fully functional "Commissions" modal |
