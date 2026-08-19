# Lump Sum Covers

> Child of [Quote Screen](../page.md). Rule ID prefix: `LSC-`

Lump Sum covers pay a one-off sum insured on the relevant event (death, disability, trauma diagnosis, etc.). Activated by clicking a cover button in the "Lump Sum Covers" panel; the panel's accordion header shows a live count of active covers.

## Cover menu by policy type

| Rule ID | Policy type | Covers offered |
|---|---|---|
| `LSC-01` | **Personal** | Life, TPD, Trauma, Cancer, Accidental Death, Needlestick, Specific Injury (7 covers) |
| `LSC-01b` | **Business** | Life, TPD, Trauma, **Specific Injury** (4 covers). Cancer, Accidental Death, and Needlestick are NOT available on Business policies. See [Policy Structure — POL-14](../policy-structure/page.md). *(Confirmed in iteration 003 — see changelog)* |

## Occupation gating — availability, not just pricing

| Rule ID | Rule |
|---|---|
| `LSC-02` | **Needlestick is only functional for Occupation Code = AA.** For every other code (AM, A1, A2, B, C, S, U), the Needlestick button **remains in the DOM** but clicking it is a no-op — no cover card appears, no Sum Insured dropdown is added. For OCC=AA, clicking activates the cover (adds a SI dropdown and Premium Structure select). *(Corrected 2026-08-19: previously stated the button was "completely removed from the DOM" for non-AA — live testing confirms it remains present but functionally inert.)* |
| `LSC-03` | Occupation Code = **AM** (Armed Forces) additionally disables **Cancer**, **Accidental Death**, and **Specific Injury** (in addition to Needlestick per `LSC-02`) — leaving only Life, TPD, Trauma, and the Business-only covers available. |
| `LSC-04` | Occupation Code = **IC** ("Individual Consideration") does not disable any cover, but triggers an underwriting-referral warning on all of them and makes Annual Income effectively required — see [Personal Details — PD-21](../personal-details/page.md). |

## Cover-by-cover reference

### Life

| Rule ID | Field | Type | Options | Default |
|---|---|---|---|---|
| `LSC-05` | Sum Insured ($) | Calc-mask, free-text | — | empty (`.`) |
| `LSC-06` | Premium Structure | Select | Stepped, Level to 50/60/65/70/75/80/100 (8 options — the full set) | Stepped |

**Discount bands** (informational, not a hard limit): $150k–$199k / $200k–$249k / $250k–$299k / $300k–$349k / $350k–$399k / $400k–$499k / $500k–$749k / $750k–$999k / $1,000k+
**No hard maximum Sum Insured was found** for Life — only the discount bands above.
**Sub-cover/rider buttons:** TI Support, Acc. TPD, Acc. Trauma, Acc. Cancer — see below.

### TPD (Total & Permanent Disability)

| Rule ID | Field | Type | Options | Default |
|---|---|---|---|---|
| `LSC-07` | Sum Insured ($) | Calc-mask | — | empty |
| `LSC-08` | Premium Structure | Select | Stepped, Level to 65, Level to 70 (**3 options only** — narrower than Life) | Stepped |
| `LSC-09` | Definition | Select | Own / Any / Modified | Own |

| Rule ID | Rule |
|---|---|
| `LSC-10` | **Maximum Sum Insured per life: $5,000,000.** Exact error: *"The maximum total Sum Insured per life for TPD Cover is $5,000,000."* |
| `LSC-11` | **Minimum Age Next Birthday for Stepped TPD: 17** — see [Personal Details — PD-14](../personal-details/page.md). |

Discount bands: $100k–$249k / $250k–$499k / $500k+

### Trauma ("Trauma Recovery Cover", TRC)

| Rule ID | Field | Type | Options | Default |
|---|---|---|---|---|
| `LSC-12` | Sum Insured ($) | Calc-mask | — | empty |
| `LSC-13` | Premium Structure | Select | Stepped, Level to 65, Level to 70 | Stepped |
| `LSC-14` | Early Trauma Benefit | Checkbox | On/Off | Off — *"pays the greater of $10,000 or 20% of the Trauma Recovery sum insured, up to a maximum of $100,000"*, for an additional 20 less-severe conditions |
| `LSC-15` | Trauma Reinstatement | Checkbox | On/Off | Off — reinstates TRC 12 months after a claim; requires sufficient Life Cover headroom or Life Cover Buyback selected |
| `LSC-16` | Continuous Trauma Benefit | Checkbox | On/Off | Off — auto-reinstates the sum insured immediately after a claim, up to 3 full claims per insured person |

**Sub-cover buttons:** Major Trauma, TPD on Trauma (Major Trauma detailed below).

| Rule ID | Rule |
|---|---|
| `LSC-17` | **Maximum Sum Insured per life for Trauma, combined with Cancer: $2,000,000.** Exact error: *"The maximum total Sum Insured per life for Trauma Recovery Cover, including Cancer Cover, is $2,000,000."* This is a **shared cap** — TRC + Cancer Sum Insured together cannot exceed $2M. |

Discount bands: $100k–$249k / $250k–$499k / $500k+

### Major Trauma (sub-cover of Trauma) — formula fully resolved

| Rule ID | Rule |
|---|---|
| `LSC-18` | Major Trauma is **not** a simple percentage multiplier — it is a standalone sub-cover with its **own independently-set Sum Insured field** and a Premium Structure locked to "Stepped" only (no Level options). |
| `LSC-19` | **Below the $25,000 TRC threshold:** max Major Trauma Sum Insured = **300% × TRC Sum Insured**. Confirmed: TRC=$20,000 → Major Trauma accepted up to $60,000, rejected above. Exact error: *"The maximum Sum Insured for Major Trauma Benefit based on the Trauma Cover Sum Insured of $X is $Y."* |
| `LSC-20` | **At or above the $25,000 TRC threshold: there is no percentage-based cap on Major Trauma.** The only constraint becomes the shared **$2,000,000 combined cap** from `LSC-17` — i.e. TRC + Major Trauma + Cancer Sum Insured together cannot exceed $2,000,000. Confirmed: with TRC=$25,000, Major Trauma was accepted all the way up to $1,975,000 (exactly filling the remaining $2M headroom) and rejected at $1,975,001. |

### Cancer

| Rule ID | Field | Type | Options | Default |
|---|---|---|---|---|
| `LSC-21` | Sum Insured ($) | Calc-mask | — | empty |
| `LSC-22` | Premium Structure | Select | Stepped, Level to 65, Level to 70 | Stepped |

| Rule ID | Rule |
|---|---|
| `LSC-23` | Shares the **same $2,000,000 combined cap** with Trauma — see `LSC-17`. No cover-specific max beyond that shared ceiling. |
| `LSC-24` | Despite its tooltip implying it builds on Trauma ("provides additional money over and above the Trauma Recovery sum insured"), **Cancer has no hard dependency on Trauma being active** — confirmed it can be activated and priced completely on its own. |

Discount bands: $100k–$249k / $250k+

### Accidental Death

> **UI button text:** `Acd. Death` (abbreviated on the cover button; full name used in error messages and documentation).

| Rule ID | Field | Type | Options | Default |
|---|---|---|---|---|
| `LSC-25` | Sum Insured ($) | Calc-mask | — | empty |
| `LSC-26` | Premium Structure | Select — **disabled/locked to Stepped** | Full 8-option list shown but unusable | Stepped |

| Rule ID | Rule |
|---|---|
| `LSC-27` | **Maximum Sum Insured: $1,000,000** — a flat, per-cover cap (not "per life"/combined wording like Trauma/Cancer). Exact error: *"The maximum sum insured for Accidental Death Cover is $1,000,000."* |
| `LSC-28` | Disabled for Occupation Code = AM (see `LSC-03`). |

Discount bands: $150k–$249k / $250k–$499k / $500k–$999k / $1,000k+

### Needlestick

| Rule ID | Field | Type | Options | Default |
|---|---|---|---|---|
| `LSC-29` | Sum Insured ($) | **Fixed-tier select dropdown — not a calc-mask** | $0, $50,000, $100,000, ... up to $500,000 in $50,000 steps (11 options) | $0 |
| `LSC-30` | Premium Structure | Select — **disabled/locked to Stepped** | Full 8-option list shown but unusable | Stepped |

| Rule ID | Rule |
|---|---|
| `LSC-31` | Only available for Occupation Code = AA — see `LSC-02`. Purpose per tooltip: *"For certain occupations, provides additional financial protection against the risk of contracting hepatitis B or C or HIV."* |
| `LSC-31b` | **Needlestick REQUIRES a companion cover** — cannot be taken standalone. Exact error: *"Needlestick Cover requires one of the following covers to also be selected: Life, Trauma Recovery, Cancer, TPD or Income Protection"*. Note: this is a **narrower** set of acceptable companions than Specific Injury (excludes Accidental Death, Mortgage & Living, and Workability). Maximum ANB: 65 (see [Personal Details — PD-31](../personal-details/page.md)). |

### Specific Injury — dependency requirement confirmed (companion cover REQUIRED)

| Rule ID | Field | Type | Options | Default |
|---|---|---|---|---|
| `LSC-32` | Sum Insured ($) | **Calc-mask input** (free-text, same as Life/TPD/Trauma/Cancer) | — | empty (`.`) |
| `LSC-33` | Premium Structure | Select | Stepped, Level to 50/60/65/70/75/80/100 (8 options — full set) | Stepped |

| Rule ID | Rule |
|---|---|
| `LSC-34` | **Specific Injury REQUIRES a companion cover.** Cannot be taken standalone. Exact error: *"Specific Injury Lump Sum requires one of the following covers to also be selected: Life, Trauma Recovery, Cancer, TPD, Accidental Death, Income Protection, Mortgage & Living or Workability"*. The cover activates successfully (button becomes disabled, Sum Insured field appears), but Apply is blocked until at least one companion cover is also active. Minimum Sum Insured: $500. Disabled for Occupation Code = AM (see `LSC-03`). Maximum ANB: 61 (see [Personal Details — PD-31](../personal-details/page.md)). *(Corrected in iteration 003 — see changelog)* |

## Life Cover riders (accelerated benefits)

Activating a rider adds its own nested card under the parent Life cover, with its own independent Sum Insured but a **Premium Structure locked to Stepped, mirroring the parent**. Once active, the rider's own toggle button becomes disabled — remove it via its card's "Remove" link, not by re-clicking the toggle.

| Rule ID | Rider | Rule |
|---|---|---|
| `LSC-35` | TI Support | Cap = MIN(100% of Life Cover Sum Insured, $300,000). Tooltip: *"Pays the Terminal illness support benefit sum insured if diagnosed as terminally ill with less than 24 months to live."* |
| `LSC-36` | Acc. TPD (Accelerated TPD) | Adds a **Definition** select: Own / Any / Modified (default Own) — same options as standalone TPD. |
| `LSC-37` | Acc. Trauma (Accelerated Trauma) | Exposes the same sub-benefit set as standalone Trauma (Early Trauma Benefit, Trauma Reinstatement, Continuous Trauma Benefit) **plus** a **Life Cover Buyback** checkbox not present on standalone Trauma (it needs a parent Life Sum Insured to buy back into). |
| `LSC-38` | Acc. Cancer | Same tooltip as standalone Cancer. Presumed same simple shape (Sum Insured + locked Premium Structure) — not independently re-verified as thoroughly as the standalone cover. |

## Cover-lifecycle rules (activation, removal, duplicates)

| Rule ID | Rule |
|---|---|
| `LSC-39` | **Life Cover supports multiple instances (at least 2 confirmed, likely 3).** Re-clicking the Life toggle button creates a new instance (not a no-op). Each new instance defaults to the next Premium Structure in sequence: 1st = Stepped, 2nd = Level to 50, 3rd = requires 2nd instance to have Sum Insured filled first (*"Please complete the 'Sum Insured' field in the above row"*). The Life button remains enabled after 2 instances. For all other Lump Sum cover types, re-clicking the toggle button after activation is a no-op: no duplicate is created and the existing row is untouched. Deactivation of any cover must go through the "Remove" link inside the cover's own card. *(Corrected in iteration 003 — see changelog)* |
| `LSC-40` | **A Lump Sum cover left with its Sum Insured never filled in (still showing the empty `.` placeholder) does NOT silently disappear on Apply** — unlike some Disability covers (see [Disability Covers](../disability-covers/page.md)). It persists in a "zombie" state: its toggle button loses its active/highlighted styling, but the cover row itself remains on screen with a Remove link. Clicking Apply in this state surfaces *"The minimum premium is $240.00 per year per Life insured"* and, on a second Apply attempt, additionally *"Please complete the 'Sum Insured' field in the above row."* The cover must be explicitly fixed (fill Sum Insured) or explicitly removed — it will not resolve itself. |
| `LSC-41` | **Needlestick standalone blocked.** Requires at least one companion cover: Life, Trauma Recovery, Cancer, TPD, or Income Protection (narrower list than Specific Injury — excludes Acd. Death, M&L, and Workability). Exact error: *"Needlestick Cover requires one of the following covers to also be selected: Life, Trauma Recovery, Cancer, TPD or Income Protection"*. See also `LSC-31b`. |
| `LSC-42` | **Needlestick uses a select dropdown for Sum Insured** ($0–$500,000 in $50,000 increments, 11 options), NOT a calc-mask free-text input. This is confirmed to be the same fixed-tier mechanism documented in `LSC-29`. |

## Premium Structure lock summary (all covers)

| Rule ID | Cover | Options available | Locked? |
|---|---|---|---|
| `LSC-43` | Life | Full 8-option set | No |
| | TPD | Stepped / Level to 65 / 70 | No |
| | Trauma | Stepped / Level to 65 / 70 | No |
| | Cancer | Stepped / Level to 65 / 70 | No |
| | Accidental Death | Full 8-option set shown | **Yes — locked to Stepped** |
| | Needlestick | Full 8-option set shown | **Yes — locked to Stepped** |
| | Specific Injury | Full 8-option set (not locked — see `LSC-33`) | No |
| | All Life riders (TI Support, Acc. TPD/Trauma/Cancer) | Mirrors parent, shown disabled | **Yes — locked** |
