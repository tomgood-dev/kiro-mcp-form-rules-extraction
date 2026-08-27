# Disability Covers

> Child of [Quote Screen](../page.md). Rule ID prefix: `DC-`

Disability covers pay an ongoing monthly benefit rather than a lump sum. *(Corrected 2026-08-26: the Mortgage & Living/Income Protection/Workability buttons are visible and enabled regardless of [Employment Status](../personal-details/page.md#field-reference) — confirmed live, this section is NOT hidden by leaving it at "Select one". Employment Status's actual, confirmed effect: Apply is blocked with* "You must complete the following fields - ... Employment Status & Annual Income $" *once a Disability cover is priced without it set — see [Personal Details — PD-20](../personal-details/page.md).)*

## ⚠️ Read this first: the "commitment" trap

| Rule ID | Rule |
|---|---|
| `DC-01` | **Merely clicking a Disability cover's toggle button does not make it real.** Its Monthly Benefit field must receive **focus and then blur** (click into it, then Tab away — even with zero characters typed) before it: (a) contributes anything to the premium, (b) counts toward the Bundling Discount tally, or (c) survives being persisted when you click Apply. |
| `DC-02` | An **activated-but-never-focused** Disability cover is a phantom entry: it shows as active in the cover-toggle UI, contributes **$0**, and is **silently dropped** if you proceed via Apply without ever focusing its benefit field. This is the opposite of the Lump Sum cover behavior in `LSC-40`, where an unfilled cover persists as a visible "zombie" with an error instead of vanishing. |
| `DC-03` | Once focused+blurred with no value typed, several Disability covers **auto-default their Monthly Benefit to their own calculated maximum** (see the per-cover formulas below) rather than staying at zero. |

**Automated-test implication:** any scenario relying on a Disability cover's presence or its auto-default value must explicitly click into and Tab out of that cover's benefit field — toggling the cover on is not sufficient.

## Cover menu by policy type

| Rule ID | Policy type | Covers offered |
|---|---|---|
| `DC-04` | **Personal** | Mortgage & Living, Income Protection, Workability |
| `DC-05` | **Business** | Business Expenses, Business Disability, Farmers Disability, **and Mortgage & Living** (the only cover shared between both menus) |

## Occupation gating

| Occ. Code | Business Expenses | Farmers Disability | Personal disability covers (M&L/IP/Workability) |
|---|---|---|---|
| AM | ✅ Available | ❌ *"not available for the selected occupation"* | ❌ Disabled (see `LSC-03` equivalent for disability) |
| AA | ✅ Available | ❌ *"not available for the selected occupation"* | ✅ Available |
| A1, A2 | ✅ Available | ❌ *"not available for the selected occupation"* | — (not directly tested, presumed same menu as AM/B/C/S/U per the "Business set" grouping) |
| B, C | ✅ Available | ✅ Available (see `DC-06` for the additional employment-status requirement) | — |
| S | ❌ *"Business Expenses Cover is not available for the selected occupation."* | ❌ Same "not available" error | — |
| U | ❌ *"This occupation is not eligible"* | ❌ *"This occupation is not eligible"* + *"not available for the selected occupation"* | — |

| Rule ID | Rule |
|---|---|
| `DC-06` | **Farmers Disability has an additional employment-status requirement on top of the occupation gate:** Employment Status must be "Self-Employed" or "Employed by own company" — even for an eligible occupation code (B or C). Exact error: *"Eligibility for Farmers Disability Cover requires an Employment Status of either 'Self Employed' or 'Employed by own company'."* Blocked for "Employed" and "Other." |
| `DC-07` | The system **always reports the maximum-benefit figure alongside any availability error simultaneously** — the cap calculation runs regardless of whether the occupation is actually eligible; the "not available"/"not eligible" text is just appended alongside it. Don't be misled into thinking a cover is available just because a cap figure is shown. |

## Mortgage & Living

| Rule ID | Field | Type | Options | Default |
|---|---|---|---|---|
| `DC-08` | Cover Type | Select | Annual Income / Monthly Mortgage | Annual Income |
| `DC-09` | Monthly Benefit ($) | Calc-mask | — | empty |
| `DC-10` | Premium Structure | Select | Stepped / Level to Expiry (2 options — this narrow set applies to every Personal disability cover, never the Life-style 8-option list) | Stepped |
| `DC-11` | Offset Benefit | Select | Agreed Value / **Agreed Value Plus** | Agreed Value Plus |
| `DC-12` | Benefit Period | Select | 2 Years / 5 Years / To Age 65 / To Age 70 | To Age 65 |
| `DC-13` | Waiting Period | Select | 14 / 30 / 60 / 90 / 180 / 365 / 730 Days | 30 Days |

**Option checkboxes (6):** Increasing Claim (✓ default), Income Top-up Package, Specific Injury Support Benefit, Immediate Assist Package, Ten-Hour Benefit (✓ default), Mental Health Discount.
**Button:** Split Benefit — splits the monthly benefit into two sums insured to allow a top-up on base cover or different waiting periods.

| Rule ID | Rule |
|---|---|
| `DC-13b` | **Occupation-based Benefit Period / Waiting Period restriction — new, 2026-08-26.** For at least Occupation Code **S** (not yet exhaustively swept across all codes), only **Benefit Period = "2 Years"** and **Waiting Period = "90 Days"** are valid — every other combination (including `DC-12`/`DC-13`'s own documented default, "To Age 65" / "30 Days") is rejected at Apply. Exact errors: *"The benefit period for the selected occupation is restricted to 2 years"* and *"The waiting period for the selected occupation is restricted to 90 days"* (both can appear together). **Confirmed to apply to both Mortgage & Living and Income Protection** (see `DC-19`/`DC-20` below) — same restriction, same wording, both covers. **Not enforced client-side**: the dropdown still shows and allows selecting every option (2/5 Years, To Age 65/70, all 7 waiting-period values) with nothing disabled or filtered out — this is an Apply-time-only server validation, so an adviser gets no warning until they submit. Control confirmed clean: Occupation Code AA has no such restriction, defaults price successfully. |
| `DC-14` | **Agreed Value vs. Agreed Value Plus:** Agreed Value *offsets* other income sources against the benefit; Agreed Value Plus does *not* offset other income. |
| `DC-15` | **Maximum monthly benefit = 45% × Pre-tax Annual Income ÷ 12, hard-capped at $7,500/month** (Agreed Value Plus basis). The formula applies up to $200,000 income (45% × $200k ÷ 12 = $7,500); above $200k, the cap holds at $7,500 regardless of income level. Confirmed exact: income $150,000 → max $5,625/month; income $200,000 → max $7,500/month; income $320,000 → still $7,500/month (cap applies). Exact error: *"The maximum remaining monthly benefit for Mortgage and Living Cover Agreed Value Plus is $7,500."* *(Corrected 2026-08-19: previously documented as uncapped formula. Live testing at multiple income levels revealed the $7,500 hard cap.)* |
| `DC-15b` | **Agreed Value variant uses a progressive (tiered) formula — NOT a flat percentage.** The marginal rate decreases as income rises: ~62% on the first ~$70k, ~50% on ~$70k–$200k, declining further above $200k (down to ~23% at $600k). Unlike the Agreed Value Plus variant (which is a simple 45% flat rate), Agreed Value appears to use an actuarial table or multi-tier formula whose exact parameters cannot be fully derived from black-box testing. Observed caps at key income levels: $80k→$4,148/mo, $100k→$5,023/mo, $150k→$7,124/mo, $200k→$9,218/mo, $300k→$13,181/mo, $400k→$15,976/mo. **No hard cap was observed** (unlike Agreed Value Plus's $7,500 cap). Exact error: *"The maximum remaining monthly benefit for Mortgage and Living Cover Agreed Value is $X,XXX."* *(Discovered 2026-08-19 via exhaustive income-level probing.)* |

## Income Protection

| Rule ID | Field | Type | Options | Default |
|---|---|---|---|---|
| `DC-16` | Policy Type | Select | Loss Of Earnings / **Loss Of Earnings Plus** | Loss Of Earnings Plus |
| `DC-17` | Monthly Benefit ($) | Calc-mask | — | empty |
| `DC-18` | Premium Structure | Select | Stepped / Level to Expiry | Stepped |
| `DC-19` | Benefit Period | Select | 2 Years / 5 Years / To Age 65 / To Age 70 | To Age 65 |
| `DC-20` | Waiting Period | Select | 14 / 30 / 60 / 90 / 180 / 365 / 730 Days | 30 Days |

See **`DC-13b`** above — at least Occupation Code S restricts these two fields to exactly
"2 Years" / "90 Days", enforced at Apply only, not reflected in the dropdown. Confirmed to
apply here identically to Mortgage & Living.

**Option checkboxes (5):** Increasing Claim (✓ default), Income Top-up Package, Specific Injury Support Benefit, Immediate Assist Package, Mental Health Discount — note: **no Ten-Hour Benefit** (that one is Mortgage & Living-only).
**Button:** Split Waiting Period — allows the benefit to be split across two different waiting periods.

| Rule ID | Rule |
|---|---|
| `DC-21` | **Maximum monthly benefit is a 3-TIER progressive formula:** Tier 1: 75% of the first $320,000 of annual income. Tier 2: +50% of income between $320,001–$560,000. Tier 3: +20% of income above $560,000. **Product hard cap: $30,000/month** regardless of income level. Formula: `min($30,000, (75% × min(income, $320k) + 50% × max(0, min(income, $560k) - $320k) + 20% × max(0, income - $560k)) ÷ 12)`. Confirmed: income $150,000 → $9,375/month (all tier 1); income $400,000 → $23,333/month (tier 1 + tier 2); income $600,000 → $30,000/month (hard cap). Exact error: *"The maximum remaining monthly benefit for Income Protection benefit is $X,XXX."* Note: the cap of $30,000/month corresponds to the tier 2 boundary ($560k) — tier 3 is effectively made irrelevant by the product cap. *(Corrected in iteration 003 — see changelog)* |
| `DC-22` | When focused+blurred with nothing typed, this field **auto-defaults to the formula max** from `DC-21` and prices successfully at that value. This auto-default behavior applies to **Loss Of Earnings Plus** (the default Policy Type). |
| `DC-22b` | **Loss Of Earnings (non-Plus) uses the same cap formula as Plus** — identical maximum values at all income levels tested ($100k→$6,250, $150k→$9,375, $200k→$12,500). The only behavioral difference is that Loss Of Earnings does NOT auto-default the benefit field on focus+blur — it remains at $0 until manually entered. *(Discovered 2026-08-19.)* |

## Workability

| Rule ID | Field | Type | Options | Default |
|---|---|---|---|---|
| `DC-23` | Monthly Benefit ($) | Calc-mask | — | empty |
| `DC-24` | Premium Structure | Select | Stepped / Level to Expiry | Stepped |
| `DC-25` | Benefit Period | Select | **Only** To Age 65, To Age 70 (no 2/5 Years) | To Age 65 |
| `DC-26` | Waiting Period | Select | **Only** 30 / 45 / 60 / 75 / 90 Days (a completely different set from M&L/IP — includes the 45- and 75-day options unique to this cover, but none of the long-tail 180/365/730-day options) | 30 Days |

**Option checkboxes (1):** Increasing Claim only — no Income Top-up/Specific Injury/Immediate Assist/Mental Health/Split options, making this the simplest of the three Personal disability covers.

| Rule ID | Rule |
|---|---|
| `DC-27` | **Maximum monthly benefit = min($10,000, 75% × Pre-tax Annual Income ÷ 12).** Product hard cap: **$10,000/month** (applies when income exceeds $160,000). Confirmed: income $100,000 → $6,250/month (formula-driven); income $150,000 → $9,375/month (formula-driven); income $200,000 → $10,000/month (cap applies, formula would give $12,500). Exact error: *"The maximum allowable monthly benefit for Workability based on annual income $X is $Y"* (note the different phrasing from IP's "maximum remaining" — same underlying mechanism, different wording). *(Corrected in iteration 003 — see changelog)* |
| `DC-28` | **Hard mutual-exclusivity rule:** *"Workability Cover is not available to be taken in conjunction with Mortgage & Living Cover or Income Protection Cover."* Workability cannot coexist with **either** M&L or IP on the same policy. Mortgage & Living and Income Protection **can** coexist with each other (confirmed — no exclusivity error when both are active together). |

## Business Expenses

| Rule ID | Field | Type | Options | Default |
|---|---|---|---|---|
| `DC-29` | Monthly Benefit ($) | Calc-mask | — | empty |
| `DC-30` | Premium Structure | Select — **disabled**, locked to Stepped | Full list shown but unusable | Stepped |
| `DC-31` | Benefit Period | Select — **disabled**, locked to "1 Year" | Full list shown (6/9/12/18/24 Months, 2 Years, 5 Years, To Age 65, To Age 70) but unusable | 1 Year |
| `DC-32` | Waiting Period | Select — enabled | 14 / 30 / 60 / 90 Days | 14 Days |

No option checkboxes.

| Rule ID | Rule |
|---|---|
| `DC-33` | **Maximum monthly benefit: flat $16,666/month, for every eligible occupation, at every income level tested** (confirmed identical at $100,000 and $150,000 annual income — this is **not** an income-percentage formula, it's a flat occupation-table cap). Exact error: *"The maximum allowable Business Expenses monthly benefit for the selected occupation is $16,666."* Note: $16,666 ≈ $200,000 ÷ 12, suggesting a possible underlying "$200,000/year business expenses" cap, but this has not been confirmed against the actual occupation table. |

## Business Disability

| Rule ID | Field | Type | Options | Default |
|---|---|---|---|---|
| `DC-34` | Classification | Select | Employed / Equity Owner (>75%) / Equity Owner (up to 75%) | Employed |
| `DC-35` | Monthly Benefit ($) | Calc-mask | — | empty |
| `DC-36` | Premium Structure | Select — **disabled**, locked to Stepped | Full list (incl. Level to Expiry) shown but unusable | Stepped |
| `DC-37` | Benefit Period | Select | 6 / 9 / 12 / 18 / 24 Months only — no Years/To-Age options | — |
| `DC-38` | Waiting Period | Select | 30 / 60 / 90 Days only — no 14-day option | — |

**Option checkboxes (2):** Partial Disablement (✓ default), Business Security — tooltip: *"Allows future increases without medical underwriting. Financial justification for increases required."*

| Rule ID | Rule |
|---|---|
| `DC-39` | **Maximum monthly benefit: flat $50,000/month** — not occupation- or income-qualified in the message wording. Exact error: *"The maximum allowable monthly benefit for Business Disability Cover is $50,000."* |

## Farmers Disability

Same shape as Business Disability, minus the Classification field; Benefit Period adds a "5 Years" option on top of the Months tiers.

| Rule ID | Field | Type | Options |
|---|---|---|---|
| `DC-40` | Monthly Benefit ($) | Calc-mask | — |
| `DC-41` | Premium Structure | Select — **disabled**, locked to Stepped | — |
| `DC-42` | Benefit Period | Select | 6 / 9 / 12 / 18 / 24 Months + 5 Years |
| `DC-43` | Waiting Period | Select | 30 / 60 / 90 Days only |

**Option checkboxes (2):** Partial Disablement, Business Security (same tooltips as Business Disability).

| Rule ID | Rule |
|---|---|
| `DC-44` | **Maximum monthly benefit: flat $10,000/month**, for every eligible occupation (B/C), at every income level tested. Exact error: *"The maximum allowable Farmers Disability monthly benefit for the selected occupation is $10,000."* See `DC-06` for the additional Employment Status gate. |

## Cross-cover exclusivity and checkbox behavior

| Rule ID | Rule |
|---|---|
| `DC-45` | **Business Disability + Farmers Disability are MUTUALLY EXCLUSIVE** within the same policy. They cannot be active simultaneously. The exclusion is NOT enforced by disabling the second button (Farmers Disability stays enabled even after Business Disability is committed) — it is enforced via server-side validation. Exact error: *"Business Disability Cover and Farmers Disability Cover are not available to be taken in conjunction with each other"*. If both are somehow in the DOM (legacy state), both show the error. |
| `DC-46` | **NO cross-policy exclusions.** Workability on a Personal policy does NOT block Business Disability or Business Expenses on a Business policy. Each policy type has its own independent disability cover rules — cross-policy combinations are unrestricted. |
| `DC-47` | **Mental Health Discount disabled when Benefit Period = 2 Years.** Applies to both Income Protection and Mortgage & Living. When Benefit Period is set to "2 Years", the Mental Health Discount checkbox becomes disabled (greyed out, cannot be checked). For all other Benefit Period values (5 Years, To Age 65, To Age 70), it remains enabled. |
| `DC-48` | **Ten-Hour Benefit (M&L only) auto-checks for Self-Employed, default OFF for Employed.** When Employment Status = "Self-Employed" (or "Employed by own company"), the Ten-Hour Benefit checkbox on Mortgage & Living defaults to ON (checked). For Employment Status = "Employed" or "Other", it defaults to OFF (unchecked). Ten-Hour Benefit does NOT appear on Income Protection (IP has 5 checkboxes; M&L has 6). |
| `DC-49` | **Increasing Claim (IP/M&L checkbox) is INDEPENDENT of Inflation Adjustment Benefit (policy-level checkbox).** These are separate controls with no cross-field dependency: unchecking one does not affect the other. Increasing Claim adjusts benefit payments over time during a claim; Inflation Adjustment Benefit adjusts the sum insured annually for inflation. |
