# Test: Commission Category Flexi Rate IC/RC Examples — commission-category-flexirate-icrc-examples-v1

> **Test file:** `commission-category-flexirate-icrc-examples-v1.spec.js`
> **Last run:** 2026-08-21 (local Edge headless) — ~3 min, 3 fresh quotes
> **Source:** ACB-13175 user story ("Select Default Commission Category"), acceptance-criteria mode
> **Result:** 3/3 checks passing

## Results

| # | Rule ID | What's Tested | Test Input | Expected | Status | Notes |
|---|---|---|---|---|---|---|
| 5 | ADV-09 | Example 2: 7.5% Flexi Rate IC/RC default | Fresh quote, Flexi Rate = 7.5% | Selected = IC-75%,RC-100%, exactly 4 documented options | ✅ Pass | v1 reported IC-100%,RC-100% here — a same-quote carryover artifact from opening Adviser Use at Flexi Rate N/A earlier in that quote. Confirmed correct once tested in its own fresh quote. |
| 6 | ADV-10 | Example 3: 15% Flexi Rate IC/RC default | Fresh quote, Flexi Rate = 15% | Selected = IC-50%,RC-50%; Life Cover row = Upfront | ✅ Pass | |
| 7 | ADV-11 | Example 4: 12.5% Flexi Rate, multiple UPFRONT IC/RC rates | Fresh quote, Flexi Rate = 12.5% | Stays on "Please Select" (does not auto-select), exactly 4 documented options | ✅ Pass | v1 reported a 5th phantom option auto-selected — carryover from testing Example 3 immediately before it in the same quote. First confirmed via a real test execution (not just probes) in this file. |

## Split from comm-cat-v2 (2026-08-21)

See `commission-category-modal-defaults-and-update-button-v1.md` for the full rationale — this file covers Parts 5-7 (Examples 2-4) of the original single 7-part file, split out to reduce sustained session load per test run.

## Deferred (not yet tested, not silently skipped)

| AC(s) | Reason |
|---|---|
| AC10/AC12/13/15-19 | Rest of the multi-option IC/RC matrix — the 9 remaining non-named Flexi Rate values are not yet covered |
| AC18 | Save Selected IC/RC Option — requires actually saving a quote, persisting real data in the shared dev environment |
| AC20-27 | Cross-quote persistence + STP payload — requires saved quotes and backend/LIFE400 payload inspection |
