# Apply Flow

> **Page type:** Section hub, child of [Business Rules](../page.md). Its own children are listed below.
>
> ⚠️ **Confidence note:** unlike the [Quote Screen](../quote-screen/page.md) section, this section was built from a **single exploratory pass** (iteration-001, 2026-08-04) rather than the adversarial, boundary-testing approach later applied to the Quote screen. Treat these as a solid first draft of the rules, not a fully stress-tested reference — limits, exact error text, and edge cases here have generally not been probed with oversized/boundary values the way Quote Screen covers were.

## What this flow is

Triggered by clicking **Apply** on the Quote screen once it validates successfully (see [Validation & Navigation — VAL-08](../quote-screen/validation-and-navigation/page.md)). A sequential, multi-step application process — direct URL navigation to a later step redirects back to the earliest incomplete one.

| Step | Screen | URL pattern |
|---|---|---|
| 1 | Quote | `/QuoteAndApply/Quote?QuoteId=...` |
| 2 | Client (Personal Details) | `/QuoteAndApply/Client?ApplicationId=...` |
| 3 | Duty of Disclosure | `/QuoteAndApply/DutyOfDisclosure?ApplicationId=...` |
| 4a–4d | Insurance History → Occupation Details → Financial Details → Tele Interview | `/QuoteAndApply/{InsuranceHistory,OccupationDetails,FinancialDetails,TeleInterview}?ApplicationId=...` |
| 5 | Personal Statement (7 pages) | `/QuoteAndApply/PersonalStatement?p=1–7&ApplicationId=...` |
| 6a–6e | Underwriting Decision → Owner & Address Detail → Payment → Submit Application → Next Steps | `/QuoteAndApply/{UnderwritingDecision,OwnerAndAddressDetail,Payment,SubmitApplication,NextSteps}?ApplicationId=...` |

## Children

| Page | Covers |
|---|---|
| [Client Details & Duty of Disclosure](client-and-duty-of-disclosure/page.md) | Steps 2–3 |
| [Insurance, Financial & Tele Interview](insurance-financial-and-tele-interview/page.md) | Step 4 (all sub-pages) |
| [Personal Statement](personal-statement/page.md) | Step 5 — the 7-page medical/lifestyle questionnaire |
| [Summary & Payment](summary-and-payment/page.md) | Step 6 (all sub-pages) |
