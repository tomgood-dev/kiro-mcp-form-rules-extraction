# Kids Cover — Test Documentation

- **Test file:** `apps/asteron-quote-apply/tests/quote-screen/kids-cover-v1.spec.js`
- **Last run:** 2026-09-14 · QA (`https://outsystems-qa.asteronlife.co.nz`) · 7 tests
- **Source:** Acceptance-criteria mode — Jira ACB-2295 (`docs/user-stories/User Story- Apply for Kids Cover.md`)
- **Result:** 7/7 passing

## Results

| # | AC(s) | What's Tested | Test Input | Expected | Status | Notes |
|---|---|---|---|---|---|---|
| 1 | AC01/AC02/AC07 | Kids Cover selectable; number-of-kids drives per-kid First/Surname/DOB/Gender/SI fields | Life $200k companion; Number of kids = 1 | Per-kid fields appear on selecting a kid | ✅ Pass | |
| 2 | AC03/AC04 | Kids SI is a dropdown, default $50,000 (Free), $50k–$200k in $10k steps | Read the Kids SI tier select | Default "$50,000 (Free)"; 16 tiers to $200,000 | ✅ Pass | Value-level: full ladder asserted |
| 3 | AC06 | Kids selected with NO primary personal cover → companion-required error | Kids only, no Personal cover, Apply | "Please add at least one Personal Insurance Cover before adding Kids Cover" | ✅ Pass | Negative/absence path |
| 4 | AC05 | Kid DOB giving ANB > 21 → max-age error (single error) | Life $200k; 1 kid; kid DOB 30y ago; Apply | "The maximum Age Next Birthday kids cover is 21" | ✅ Pass | Kid DOB = repeating-list `l2` input; set via `fill()`, self-verified |
| 5 | BR (max kids) | Number-of-kids select caps at 9 | Read the number-of-kids select options | Options 0–9 (max 9 per life) | ✅ Pass | Business Rule 1 |
| 6 | AC08 | Kid SI > $50k dynamically calculates + displays a premium | Life $200k; 1 kid @ $100k; DOB blurred | Premium increases (kids priced) | ✅ Pass | 1 kid @ $100k = +$5.00/mo → $356.16/yr (was $296.16). Value-level |
| 7 | AC09 | Multiple kids >$50k → ONE aggregated "Kids" premium line | Life $200k; 3 kids @ $100k | Exactly one "Kids" line regardless of count | ✅ Pass | 3 kids → single "Kids $15.00" line; Life $24.68 + Kids $15.00 = $39.68/mo ($476.16/yr) |

## Deferred

_None — all ACs (AC01–AC09) + both business rules encoded and passing._

## Notes

- **AC08/AC09 correction (2026-09-14):** these were previously a single hollow placeholder (only
  checked the word "Kids" was on the page) — the coverage audit's one silent omission. Now split
  into two real value-level tests. During encoding, an apparent "$0.00 kids don't price" defect was
  investigated and **retracted as a test-driving artifact**: the kid DOB shows a transient
  "Required field!" until the field is **blurred**, and setting a kid SI re-renders the kids list
  (so DOBs must be filled after SI). The `setupKidsCover` helper encodes the fix (fill→blur;
  SI-before-DOB; landing-verified). Kids pricing works correctly — no defect. Evidence:
  `probes/evidence/03-probe-kids-premium-2026-09-14/`.
