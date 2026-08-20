# Quote Screen ("Illustration" step)

> **Page type:** Section hub, child of [Business Rules](../page.md). Its own children are listed below.

## What this screen is

The first step of the Quote & Apply flow. The adviser configures one or more lives to be insured, each life carrying one or more policies (Personal and/or Business), each policy carrying a selection of Lump Sum and Disability covers. The screen calculates and displays premiums live as covers and personal details are filled in. Clicking **Apply** validates everything and — if valid — silently advances to the Client Details step of the Apply Flow.

**URL:** `https://outsystems-dev.asteronlife.co.nz/QuoteAndApply/Quote?QuoteId=...&ApplicationId=...`
**Reached via:** Quote & Apply list (`/QuoteAndApply/`) → **New Quote** link (opens in a new tab, blank `QuoteId`/`ApplicationId` confirms it's genuinely new).

## Screen anatomy

```
Illustration
├── Life 1, Life 2, ... tabs (one per insured person — see Policy Structure)
│   ├── Personal Details (accordion)
│   └── Policies (accordion)
│       ├── Personal 1, Business 1, ... (one or more policies per life)
│       │   ├── Policy-level toggles (Inflation Adjustment, Premium Freeze, etc.)
│       │   ├── Lump Sum Covers
│       │   ├── Disability Covers
│       │   └── Kids Cover (Personal policies only)
├── Premium summary panel (sticky, right-hand side)
│   ├── Total (All Lives)
│   └── Per-life breakdown: per-cover premium, Payment frequency, Bundling Discount, Adviser Use, Loadings
└── Footer: Close · View PDF · Save as New · Save · Apply
```

## Children

| Page | Covers |
|---|---|
| [Personal Details](personal-details/page.md) | Per-life fields: Name, DOB/Age, Gender, Smoking, Occupation, Employment Status, Annual Income |
| [Policy Structure](policy-structure/page.md) | Policy-level toggles, the Personal/Business mechanism, multi-life (Add Life) |
| [Lump Sum Covers](lump-sum-covers/page.md) | Life, TPD, Trauma, Cancer, Accidental Death, Needlestick, Specific Injury |
| [Disability Covers](disability-covers/page.md) | Mortgage & Living, Income Protection, Workability, Business Expenses, Business Disability, Farmers Disability |
| [Kids Cover](kids-cover-and-multi-life/page.md) | Kids Cover fields and limits |
| [Premium & Bundling](premium-and-bundling/page.md) | Premium triggers, payment frequency, bundling discount |
| [Adviser Use / Commission Category](adviser-use-commission/page.md) | The "Commissions" modal: agency-wide default commission category, Flexi Rate ↔ commission interactions, IC/RC selection |
| [Validation & Navigation](validation-and-navigation/page.md) | Full error catalog, footer button behavior, the Apply transition |

## The most important thing to know before reading further

**The "Apply-time diagnostic" technique.** Clicking Apply re-runs full validation and shows, per cover, exactly what's still wrong — missing fields, limit breaches, unmet dependencies — as a live diff that shrinks as you fix things. Setting a deliberately oversized value and reading the resulting error text is how nearly every limit and formula in this document was reverse-engineered. See [Validation & Navigation](validation-and-navigation/page.md) for the full mechanism.
