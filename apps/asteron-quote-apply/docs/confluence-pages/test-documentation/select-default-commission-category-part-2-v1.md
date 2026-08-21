# Test: Select Default Commission Category — Part 2 — select-default-commission-category-part-2-v1

> **Test file:** `select-default-commission-category-part-2-v1.spec.js`
> **Covers:** AC10 (partial), AC15 — see Part 1 for AC01-05, AC09 (partial), AC10 (partial), AC11, AC14
> **Last run:** 2026-08-21 (local Edge headless) — ~3 min, 3 fresh quotes
> **Source:** ACB-13175 user story ("Select Default Commission Category"), acceptance-criteria mode
> **Result:** 3/3 checks passing

## Results

| # | Rule ID | What's Tested | Test Input | Expected | Status | Notes |
|---|---|---|---|---|---|---|
| 5 | ADV-09 (AC10, AC14) | Example 2: 7.5% Flexi Rate IC/RC default — only one valid option | Fresh quote, Flexi Rate = 7.5% | Selected = IC-75%,RC-100%, exactly 4 documented options | ✅ Pass | v1 reported IC-100%,RC-100% here — a same-quote carryover artifact from opening Adviser Use at Flexi Rate N/A earlier in that quote. Confirmed correct once tested in its own fresh quote. |
| 6 | ADV-10 (AC10, AC14) | Example 3: 15% Flexi Rate IC/RC default — only one valid option | Fresh quote, Flexi Rate = 15% | Selected = IC-50%,RC-50%; Life Cover row = Upfront | ✅ Pass | |
| 7 | ADV-11 (AC10, AC15) | Example 4: 12.5% Flexi Rate, multiple valid UPFRONT IC/RC options | Fresh quote, Flexi Rate = 12.5% | Stays on "Please Select" (does NOT auto-select — more than one valid option exists), exactly 4 documented options | ✅ Pass | v1 reported a 5th phantom option auto-selected — carryover from testing Example 3 immediately before it in the same quote. First confirmed via a real test execution (not just probes) in this file. This is the only one of the four named examples that demonstrates AC15 rather than AC14 — see Part 1 for the AC10/AC14/AC15 explanation. |

## Split from comm-cat-v2 (2026-08-21), renamed 2026-08-21

See `select-default-commission-category-part-1-v1.md` for the full rationale on the split and rename — this file covers Parts 5-7 (Examples 2-4) of the original single 7-part file, split out to reduce sustained session load per test run, and later renamed from `commission-category-flexirate-icrc-examples-v1` to this story-based `select-default-commission-category-part-N` scheme.

## Deferred (not yet tested, not silently skipped)

| AC(s) | Reason |
|---|---|
| AC10 (remainder), AC12/13/15 (remainder)/16-19 | Rest of the multi-option IC/RC matrix — the 9 remaining non-named Flexi Rate values are not yet covered |
| AC18 | Save Selected IC/RC Option — requires actually saving a quote, persisting real data in the shared dev environment |
| AC20-27 | Cross-quote persistence + STP payload — requires saved quotes and backend/LIFE400 payload inspection |
