# Apply flow — FULL end-to-end submission CONFIRMED (2026-09-15)

**Environment:** QA `https://outsystems-qa.asteronlife.co.nz`, account `a`
(tom.good+good@resolutionlife.com.au). Driven live via `tools/server.js` + `tools/batch.js`.

**Outcome:** the ENTIRE Quote → Apply → Submit flow was completed end-to-end and issued a real
**Policy Number `J4211922`** (Personal Insurance 1 — Life Cover $1,000,000, premium $67.38/month,
Direct Debit, Underwriting = Accepted). There is **no backend blocker and no payment gate** that
prevents completion on QA. This supersedes earlier notes that deferred apply-flow ACs as
"payment-gated" / "address-service blocked" / "underwriting-engine backend-blocked" — all three
were wrong conclusions, corrected here and in `.kiro/steering/project-context.md` points 8–9.

## The full screen map (as driven, confirmed reachable & completable)

Quote → **Client Summary** → **Duty of Disclosure** → **Personal Details** →
**Insurance & Financial Details** → **Tele Interview** → **Personal Statement** →
**Underwriting Decision** → **Owner & Address Detail** → **Payment** → **Submit Application** →
**Next Steps** (policy number).

| Screen | URL | What it needs (confirmed) |
|---|---|---|
| Client Summary | `/QuoteAndApply/Quote?...` | Per-life First/Last name (real `fill`), DOB that **matches the quote ANB** (else "The date of birth does not match client's age given for the quote"). "Proceed to application". |
| Duty of Disclosure | `/QuoteAndApply/DutyOfDisclosure` | Adviser-confirmation Yes/No → Yes, Next. |
| Personal Details | `/QuoteAndApply/PersonalDetails` | Title=Mr, Cm+Kg (masked), Mobile, Email, **home address via lookup** (focus + keyboard type + pick suggestion), postal-same-as-home=Yes, own DOB matches ANB. |
| Insurance & Financial Details | `/QuoteAndApply/InsuranceAndFinancialDetails` | 3-page loop: OCCUPATION hazardous-duties=No; FINANCIAL income (masked `...b8-Input_AnswerTextMasked2`)=120000 + mortgage=No; INSURANCE HISTORY 2×No. Deferred items appear on an "Unanswered Questions" summary. Ends "Questionnaire Completed". |
| Tele Interview | `/QuoteAndApply/TeleInterview` | "Use tele-interview service?" — Yes/No are **radio-styled DIVs** (`...b3-RadioButton2`), click the nested `input`. No → Personal Statement. |
| Personal Statement | `/QuoteAndApply/PersonalStatement` (7 pages) | Medical/lifestyle questionnaire. See "The 3 answer-traps" below — these are what actually kept it "incomplete", NOT any backend error. |
| Underwriting Decision | `/QuoteAndApply/UnderwritingDecision` | Renders engine result: "your application has been accepted". Optional file attach. Next. |
| Owner & Address Detail | `/QuoteAndApply/OwnerAndAddressDetail` | Select existing person ("Mr Solo One", value 0) in BOTH `Dropdown_PolicyOwnerRelatedParty` and `Dropdown_AddressRelatedParty`, and click **"Add"** for each (dropdown alone is not enough). Next. |
| Payment | `/QuoteAndApply/Payment` | `DropdownPaymentMethod`=Direct Debit → Bank Name/Account Name/Bank(01)/Branch(0001)/AccountNumber(0123456)/AccountNumber2(00). Tick product-line + DD-authority checkboxes, click **"Apply to Policy"** (attaches method+start-date to the product row). Next. |
| Submit Application | `/QuoteAndApply/SubmitApplication` | Tick `AcknowledgmentCheckbox`, click **"Submit Application"**. |
| Next Steps | `/QuoteAndApply/NextSteps` | "Thank you. Your application has been submitted." + Policy Number. |

## The 3 answer-traps on Personal Statement (root cause of "won't complete")

The questionnaire has 6 linear pages (Mental Health, Physical Health Ever, Physical Health Last 5
Years, Other Medical History, Family History, Underwriting Assessments & Claims) plus special
deferred questions reached via "Answer" buttons on the Unanswered summary (Residence & Travel,
Tobacco, Alcohol). Answering the Yes/No pages "No" is easy. What blocked completion — and was
almost misdiagnosed as a backend failure — was that THREE questions need REAL answers:

1. **RESIDENCE** — "Are you a NZ citizen…?" must be **Yes**. A blanket "set every RadioButton2 to
   No" wrongly sets citizen=No, which then reveals a mandatory "How long have you lived in NZ?"
   dropdown that keeps the item uncommitted. Setting **Yes** REMOVES that dropdown and commits.
   → **Do NOT include the citizen radio in a batch-No sweep.**
2. **ALCOHOL** — "how many standard drinks… in a typical week?" is a **masked number field**
   (`...b8-Input_AnswerTextMasked`). Must be filled (e.g. 5) via calcmask with the **FULL element
   id** — a partial-id match hits the wrong element and silently does nothing. Cannot be blank.
3. **FAMILY HISTORY** — a "select all that apply" checkbox list. Leaving everything empty is NOT a
   valid answer; you must tick **"None of the above"** (the last checkbox) to commit.

Once the Unanswered count = 0, Next → "Questionnaire Completed" → Next.

## The red-herring toast

The toast **"We encountered an error when calling the underwriting engine."** appears repeatedly
during the Personal Statement but is **TRANSIENT and non-blocking** — answers still persist, the
Underwriting Decision still returns "Accepted", and submission still completes. It was wrongly
written up mid-session as a hard backend blocker (the "unanswered count stayed at 3" was actually
because of the 3 answer-traps above, not the toast). **Do not treat it as a gate.**

## Efficiency: reopen by ApplicationId (from apply-flow-map-2026-09-10.md, still valid)

Driving to Client Summary + Proceed mints a real `ApplicationId` (in the URL). `page.goto(
'/QuoteAndApply/<Screen>?ApplicationId=<id>')` RESUMES the application without a quote rebuild; the
app redirects direct nav to the earliest INCOMPLETE step. Use this to iterate on a deep screen.

## What this unblocks (test generation)

Every apply-flow AC that was deferred on reachability grounds is now testable:
- **occupation-apply-flow-v1** (Occupation screen = the OCCUPATION page of Insurance & Financial
  Details: hazardous-duties; AC03 Previous→Insurance History, AC04 Next→Income/Financial).
- **navigation-behaviour-v1** (URE / wizard Previous/Next navigation across the apply flow).
- **multi-lives-and-policies-v1** MLP-11/12/20/21 (per-life proceed / full submission).
- Any Personal Statement, Underwriting, Owner/Address, Payment, Submit ACs.

Encoding them requires promoting the proven interaction sequences into `helpers/quote-helpers.js`
(see the `applyFlow*` helpers added 2026-09-15) so each spec is robust rather than re-deriving the
page-cycling/answer-trap logic. Reliability caveat: the Personal Statement's page-cycling +
dynamic ids make it the most fragile screen to automate — build on the helpers, assert on
`head`/URL transitions, and reopen-by-ApplicationId to keep runtimes sane.
