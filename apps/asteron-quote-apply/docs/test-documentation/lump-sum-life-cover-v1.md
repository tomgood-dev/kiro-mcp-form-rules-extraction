# Test: Lump Sum Life Cover — lump-sum-life-cover-v1

> **Test file:** `lump-sum-life-cover-v1.spec.js`
> **Last run:** 2026-08-28 (local Edge headless) — ~20 min, 17 tests, 2 workers
> **Source:** ACB-2242 user story ("Lump Sum Life Cover"), acceptance-criteria mode
> **Result:** 17/17 passing (all testable ACs confirmed matching the story)

## Results

| # | AC | What's Tested | Test Input | Expected | Status |
|---|---|---|---|---|---|
| 1 | AC01/AC02 | Life cover available to apply for on a Personal quote | New quote, Personal | Life button present + activatable | ✅ Pass |
| 2 | AC03 | Life → SI field + Inflation auto-ticked + Premium Structure default Stepped | Activate Life | SI present; Inflation checked; Structure = Stepped | ✅ Pass |
| 3 | AC05 | Entering SI calculates a premium | SI $500,000 | Total premium > 0 | ✅ Pass |
| 4 | AC06 | Add/remove cover reflects in premium | Add Life $500k, remove | Premium appears then clears | ✅ Pass |
| 5 | AC07 | Stepped, ANB outside 11–75 → age-range error | ANB 76, Stepped, Apply | "Age Next Birthday must be between 11 and 75" | ✅ Pass |
| 6 | AC08 | Level to 50 max age | ANB 46, Level to 50, Apply | "...level to 50 'Life Cover' is 45" | ✅ Pass |
| 7 | AC09 | Level to 60 max age | ANB 56, Level to 60, Apply | "...level to 60 'Life Cover' is 55" | ✅ Pass |
| 8 | AC10 | Level to 65 max age | ANB 61, Level to 65, Apply | "...level to 65 'Life Cover' is 60" | ✅ Pass |
| 9 | AC11 | Level to 70 max age | ANB 66, Level to 70, Apply | "...level to 70 'Life Cover' is 65" | ✅ Pass |
| 10 | AC12 | Level to 75 max age | ANB 71, Level to 75, Apply | "...level to 75 'Life Cover' is 70" | ✅ Pass |
| 11 | AC13 | Level to 80 max age (see note) | ANB 71, Level to 80, Apply | "...level to 80 'Life Cover' is 70" | ✅ Pass |
| 12 | AC14 | Level to 100 max age | ANB 76, Level to 100, Apply | "...level to 100 'Life Cover' is 75" | ✅ Pass |
| 13 | AC15 | Any Level + ANB < 17 → min-age error | ANB 16, Level to 100, Apply | "Minimum Age Next Birthday for level 'Life Cover' is 17" | ✅ Pass |
| 14 | AC16 | Stepped + SI > $50k + ANB 11–16 → under-17 cap | ANB 14, SI $50,001 | "...under Age Next Birthday 17 is $50,000" | ✅ Pass |
| 15 | AC19 | Yearly premium < $240 → minimum-premium error | SI $1,000, Apply | "The minimum premium is $240.00..." | ✅ Pass |
| 16 | AC21 | Premium Freeze unticks Inflation (mutual exclusion) | Tick Premium Freeze | Inflation flips to unchecked | ✅ Pass |
| 17 | AC23 | Max 3 Life covers — Life button disabled after 3 | Activate Life ×3 | Life button disabled | ✅ Pass |

## Deferred (not yet encoded — testable, not blocked)

These ACs became testable after probing (frequency / we-pay / flexirate controls found — see
`probes/probe-life-checkboxes.js`) but are not yet encoded in this v1:

| AC | What it needs | Selector found |
|---|---|---|
| AC04 | Change payment frequency → premium recalculates | `id*="PaymentFrequencyDropdown"` |
| AC20 | ANB > 65 + We Pay Your Premiums != None → error | `id*="Dropdown_Premiums"` |
| AC22 | Flexi rate != N/A → premium reduced by % | `id*="Dropdown_FlexiRate"` |

## Deferred (needs state / decision)

| AC | Reason |
|---|---|
| AC17 | Combined SI > $250k, ANB 17–21, no income — needs income/occupation state setup |
| AC18 | Part-time worker + combined SI > $500k — "part time" input path unclear; needs probe |

## Notes

- AC13 (Level to 80) states its max age is 70 — the same as AC12 (Level to 75). This looks
  copy-paste-suspicious in the source story (80 > 75 yet cap is lower). Asserted as written per
  the story; **flagged for author clarification** (the app currently matches it, so it passes).
- AC08/AC09 say "age" while AC10–14 say "age next birthday" — treated all as Age Next Birthday
  (the only age field on the quote screen). Minor source wording inconsistency, not behavioural.
- Assertions match error text on stable core substrings (e.g. "level to 50" + "Life Cover" + "is 45")
  because several message quotes in the source have unbalanced quotation marks.
