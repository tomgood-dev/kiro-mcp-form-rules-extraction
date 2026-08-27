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
| `KID-12` | *(Corrected 2026-08-26)* Date of birth is a genuine native date input with hard min/max bounds — **not** a ~21-year window as previously stated. Confirmed live (today = 2026-08-26): `min="1952-08-26"`, `max="2016-08-26"` — a **64-year span**, allowing a "kid" to be entered as anywhere from 10 to 74 years old. Both bounds are exactly N years before today (74 and 10 respectively), so they're rolling/relative, not fixed calendar dates — re-derive relative to the current date, same caveat as before, just with the right span. This is suspiciously close to the main Personal Details Age Next Birthday range (`PD-11`: 11–75, a 64-year spread) — the kid DOB field may simply reuse the same generic adult age-validation logic rather than having genuine kid-specific bounds; worth flagging to a BA, since a 74-year-old "kid" is very unlikely to be intentional. |
| `KID-13` | Not available on Business policies — see [Policy Structure](../policy-structure/page.md). |
