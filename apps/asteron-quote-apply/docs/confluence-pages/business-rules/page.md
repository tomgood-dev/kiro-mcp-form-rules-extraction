# Asteron Life — Quote & Apply: Business Rules (Hub)

> **Page type:** Parent/hub page. This page should sit at the top of the Confluence page tree for this documentation set. Everything else nests underneath it as child pages, mirroring the folder structure this content ships in:
> `business-rules/` → `quote-screen/*`, `apply-flow/*`, `technical-automation-appendix/`

**Audience:** Business Analysts and Developers/QA who need to reference exact field behavior, validation rules, limits, and dependencies for the Asteron Life Quote & Apply form (OutSystems Reactive Web app).

**Source of truth:** Every rule on every child page was derived from direct interaction with the live `outsystems-dev` environment (Playwright-driven browser automation), not from design documents. Where a rule could not be conclusively verified, or where two independent testing sessions produced conflicting results, this is stated explicitly on the relevant page rather than silently resolved — see **§4 Known Discrepancies** below.

---

## 1. How to use this documentation

- Every discrete business rule has a **stable Rule ID** (e.g. `LSC-07`, `DC-12`) shown in the left column of its table row or in a small metadata block. Cite this ID in Jira tickets, test case names, and code review comments instead of re-describing the rule — e.g. *"Covers LSC-07 (TPD max sum insured)"*.
- Rule IDs are **prefixed by page** (see the index below) and numbered sequentially within that page. They are stable within a page but not guaranteed unique across the whole document set beyond their prefix — always quote the full ID including prefix.
- Pages are split into two top-level sections — **Quote Screen** (the "Illustration" step, extensively stress-tested) and **Apply Flow** (the multi-step application process after Apply, tested to a single-pass depth) — plus a **Technical/Automation Appendix** kept separate so these business-facing pages stay free of element IDs and Playwright automation notes.
- **Confidence levels differ by section.** The Quote Screen pages were built from an exhaustive, deliberately adversarial testing pass (oversized values, boundary conditions, cross-field dependency probing) across two separate sessions. The Apply Flow pages were built from a single exploratory pass and have not been stress-tested to the same depth — treat Apply Flow rules as a solid first draft that still needs the same rigor applied to Quote Screen.

---

## 2. Page index

### Quote Screen (`quote-screen/`)
| Page | Rule ID prefix | Covers |
|---|---|---|
| [Personal Details](quote-screen/personal-details/page.md) | `PD-` | Name, DOB/Age, Gender, Smoking, Occupation, Employment Status, Annual Income — fields, validation, cross-field effects |
| [Policy Structure (Personal/Business)](quote-screen/policy-structure/page.md) | `POL-` | Personal-level toggles (Inflation Adjustment, Premium Freeze, etc.), the Personal/Business mechanism, multi-life (Add Life) |
| [Lump Sum Covers](quote-screen/lump-sum-covers/page.md) | `LSC-` | Life, TPD, Trauma, Cancer, Accidental Death, Needlestick, Specific Injury + all sub-benefits/riders |
| [Disability Covers](quote-screen/disability-covers/page.md) | `DC-` | Mortgage & Living, Income Protection, Workability, Business Expenses, Business Disability, Farmers Disability |
| [Kids Cover](quote-screen/kids-cover-and-multi-life/page.md) | `KID-` | Kids Cover fields, limits, and per-kid behavior |
| [Premium & Bundling](quote-screen/premium-and-bundling/page.md) | `PREM-` | Premium calculation triggers, payment frequency conversion, bundling discounts |
| [Validation & Navigation](quote-screen/validation-and-navigation/page.md) | `VAL-` | Full error-message catalog, Save/Save as New/Close/View PDF/Apply button behavior, the Apply→Client-summary transition |

### Apply Flow (`apply-flow/`)
| Page | Rule ID prefix | Covers |
|---|---|---|
| [Client Details & Duty of Disclosure](apply-flow/client-and-duty-of-disclosure/page.md) | `CD-` | Step 2 (Client) and Step 3 (Duty of Disclosure) |
| [Insurance, Financial & Tele Interview](apply-flow/insurance-financial-and-tele-interview/page.md) | `IFT-` | Step 4 sub-pages: Insurance History, Occupation Details, Financial Details, Tele Interview |
| [Personal Statement](apply-flow/personal-statement/page.md) | `PS-` | Step 5 — the 7-page medical/lifestyle questionnaire |
| [Summary & Payment](apply-flow/summary-and-payment/page.md) | `SUM-` | Step 6 sub-pages: Underwriting Decision, Owner & Address, Payment, Submit, Next Steps |

### Reference
| Page | Covers |
|---|---|
| [Technical / Automation Appendix](technical-automation-appendix/page.md) | Element ID patterns, OutSystems interaction gotchas, Playwright/server.js automation notes — **not needed by BAs**, kept here for developers and QA automating tests against these rules |

---

## 3. Rule ID prefix legend

| Prefix | Page | Prefix | Page |
|---|---|---|---|
| `PD` | Personal Details | `PREM` | Premium & Bundling |
| `POL` | Policy Structure | `VAL` | Validation & Navigation |
| `LSC` | Lump Sum Covers | `CD` | Client Details & Duty of Disclosure |
| `DC` | Disability Covers | `IFT` | Insurance, Financial & Tele Interview |
| `KID` | Kids Cover | `PS` | Personal Statement |
| | | `SUM` | Summary & Payment |

---

## 4. Known discrepancies between testing sessions — ~~read before trusting any single source~~ ALL RESOLVED (iteration 003)

Two independent testing sessions (2026-08-11 direct browser automation, and 2026-08-12 via `server.js`/Kiro CLI from a different environment) produced **conflicting observations** on the following points. All four were re-verified in iteration 003 (2026-08-13) and are now **resolved**:

1. ~~**Is "Personal"/"Business" a two-state toggle, or an add-policy action supporting multiple concurrent policies per life?**~~ **RESOLVED: add-policy action.** Each click of Personal/Business creates a new, independently-numbered policy (Personal 1, Personal 2, Business 1, ...). The "Policies" badge counts up. Session 2's "toggle" description was likely observing only a single policy without clicking the buttons multiple times. See [Policy Structure — POL-06 through POL-09](quote-screen/policy-structure/page.md). *(Confirmed in iteration 003)*
2. ~~**What is the Business policy's 4th Lump Sum cover?**~~ **RESOLVED: Specific Injury.** The Business policy Lump Sum menu offers Life, TPD, Trauma, and Specific Injury (4 covers). Cancer, Accidental Death, and Needlestick are NOT available on Business. See [Policy Structure — POL-14](quote-screen/policy-structure/page.md). *(Confirmed in iteration 003)*
3. ~~**Does the Business/Personal cover-menu split correlate with policy type, or with Occupation Code?**~~ **RESOLVED: driven by policy type.** The cover menu changes based on which policy type (Personal vs Business) is selected. Occupation code affects individual cover *eligibility* within that menu but does not control which covers appear. See [Policy Structure — POL-16](quote-screen/policy-structure/page.md). *(Confirmed in iteration 003)*
4. ~~**Does switching Life tabs require the current life to meet a minimum bar?**~~ **RESOLVED: Yes, Add Life IS blocked when the current life doesn't meet minimum.** Modal: *"Cannot proceed — Please enter the minimum requirement for a quote before proceeding to another life"*. The earlier "unconditional" finding was likely from a state before any cover was partially configured. See [Policy Structure — POL-12](quote-screen/policy-structure/page.md). *(Confirmed in iteration 003)*

---

## 5. Maintenance

When a discrepancy above gets resolved, or a new rule is discovered: update the relevant child page directly, bump nothing here except this index if a page is added/removed/renamed. Do not let this hub page accumulate rule detail — it should stay a map, not a rulebook.
