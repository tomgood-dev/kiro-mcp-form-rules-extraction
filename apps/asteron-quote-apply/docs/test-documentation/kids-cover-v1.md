# Kids Cover — Test Documentation

- **Test file:** `apps/asteron-quote-apply/tests/quote-screen/kids-cover-v1.spec.js`
- **Last run:** 2026-09-07 · QA (`https://outsystems-qa.asteronlife.co.nz`) · ~15 min · 6 tests
- **Source:** Acceptance-criteria mode — Jira ACB-2295 (`docs/user-stories/User Story- Apply for Kids Cover.md`)
- **Result:** 6/6 passing

## Results

| # | AC(s) | What's Tested | Test Input | Expected | Status | Notes |
|---|---|---|---|---|---|---|
| 1 | AC01/AC02/AC07 | Kids Cover selectable; number-of-kids drives per-kid First/Surname/DOB/Gender/SI fields | Life $200k companion; Number of kids = 1 | Per-kid fields appear on selecting a kid | ✅ Pass | |
| 2 | AC03/AC04 | Kids SI is a dropdown, default $50,000 (Free), $50k–$200k in $10k steps | Read the Kids SI tier select | Default "$50,000 (Free)"; 16 tiers to $200,000 | ✅ Pass | Value-level: full ladder asserted |
| 3 | AC06 | Kids selected with NO primary personal cover → companion-required error | Kids only, no Personal cover, Apply | "Please add at least one Personal Insurance Cover before adding Kids Cover" | ✅ Pass | Negative/absence path |
| 4 | AC05 | Kid DOB giving ANB > 21 → max-age error (single error) | Life $200k; 1 kid; kid DOB 30y ago; Apply | "The maximum Age Next Birthday kids cover is 21" | ✅ Pass | Kid DOB = repeating-list `l2` input; set via `fill()`, self-verified value landed |
| 5 | BR (max kids) | Number-of-kids select caps at 9 | Read the number-of-kids select options | Options 0–9 (max 9 per life) | ✅ Pass | Business Rule 1 |
| 6 | AC08/AC09 | Kid SI above $50k adds a single "Kids" premium line | Life $200k; kids SI > $50k; read premium panel | One "Kids" premium line regardless of number of kids | ✅ Pass | Value-level premium-panel check |

## Deferred

_None — all ACs (AC01–AC09) + both business rules encoded and passing._
