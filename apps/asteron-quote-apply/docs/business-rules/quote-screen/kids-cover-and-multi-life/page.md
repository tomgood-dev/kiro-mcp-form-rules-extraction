# Kids Cover

> Child of [Quote Screen](../page.md). Rule ID prefix: `KID-`

Kids Cover provides a lump sum benefit for the insured's children. It's a Personal-policy-only concept.

## Fields

| Rule ID | Field | Type | Options | Default |
|---|---|---|---|---|
| `KID-01` | Number of Kids | Select | 0–9 | 0 |

Selecting a number **N** greater than 0 generates **N** identical repeating blocks ("Kid 1" ... "Kid N"), each with:

| Rule ID | Per-kid field | Type | Required |
|---|---|---|---|
| `KID-02` | First Name | Text | No |
| `KID-03` | Surname | Text | No |
| `KID-04` | Gender | Button group (Male/Female) | No |
| `KID-05` | Date of birth | Native `<input type="date">` | **Yes — the only required field per kid** |
| `KID-06` | Sum insured | Select | No |

## Sum Insured tier list

| Rule ID | Rule |
|---|---|
| `KID-07` | Fixed tier list from **$50,000 (labelled "Free" — no additional premium)** up to **$200,000**, in **$10,000 increments** (16 options total: $50k, $60k, $70k, ... $200k). |

## Dependency and premium rules

| Rule ID | Rule |
|---|---|
| `KID-08` | **Kids Cover requires at least one Personal Insurance Cover.** Cannot be submitted standalone — Apply is blocked until at least one cover (any type from the Personal menu: Life, TPD, Trauma, Cancer, Acd. Death, Needlestick, Specific Injury, M&L, IP, or Workability) is active. The kid detail rows render immediately when Number of Kids > 0, but Apply produces: *"Please add at least one Personal Insurance Cover before adding Kids Cover"*. |
| `KID-09` | **Kids premium is a single aggregated line** within the parent life's premium total — NOT itemized per child. There is no "Kid 1 premium" / "Kid 2 premium" breakdown visible in the premium panel. |
| `KID-10` | Kids Cover premium is only charged once a kid's Sum Insured **exceeds** the free $50,000 tier. |

## Other rules

| Rule ID | Rule |
|---|---|
| `KID-11` | Maximum 9 kids per life. |
| `KID-12` | *(Re-corrected 2026-09-02 — the 2026-08-26 "correction" below was itself wrong.)* Date of birth is a genuine native date input with hard min/max bounds, and the field genuinely is a **~21-year window**, as originally stated before the (incorrect) 2026-08-26 revision. Confirmed live (today = 2026-09-02) by disambiguating against the known ADULT DOB field (`id="b15-Input_BirthDate"`) in the same page state: the adult field showed `min="1952-09-02"`, `max="2016-09-02"` (a genuine 64-year span, matching `PD-11`'s 11–75 Age Next Birthday range) — while the genuinely separate kid DOB field showed `min="2005-09-04"`, `max="2026-09-02"` (a genuine **21-year span**). The 2026-08-26 investigation most likely read the adult's own field by mistake and concluded the two were the same. Both bounds are rolling/relative to today, not fixed calendar dates — re-derive relative to the current date. A ~21-year window is also the business-sensible reading for a "Kids Cover" field, unlike the previous 64-year finding which would have allowed a 74-year-old "kid." |
| `KID-13` | Not available on Business policies — see [Policy Structure](../policy-structure/page.md). |
