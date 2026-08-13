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
| `KID-08` | Kids Cover premium is only charged once a kid's Sum Insured **exceeds** the free $50,000 tier. |

## Other rules

| Rule ID | Rule |
|---|---|
| `KID-09` | Maximum 9 kids per life. |
| `KID-10` | Date of birth is a genuine native date input with hard min/max bounds observed at roughly a 21-year rolling window ending "today" — re-derive the exact bound relative to the current date rather than treating it as a fixed calendar date. |
| `KID-11` | Not available on Business policies — see [Policy Structure](../policy-structure/page.md). |
