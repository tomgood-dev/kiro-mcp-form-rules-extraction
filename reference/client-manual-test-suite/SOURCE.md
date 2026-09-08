# Source & provenance

- **Source:** OneDrive/SharePoint export — folder `OneDrive_2_09-09-2026` _(paste exact SharePoint library path if known)_
- **Exported by:** (client — files authored by MUNRO, Lachlan / ANSLOW, Melanie per file metadata)
- **Export date:** 2026-09-09
- **Applications covered:** Asteron Life Quote & Apply (the same app we automate) — NZ covers: Kids, Needlestick, Workability, TPD, Specific Injury, Major Trauma, Mortgage & Living / IP, Loadings, Commissions, Clone Quote, Payment, Business Life/Trauma/Expenses/Disability/Farmers.
- **Contents inventory:** ~18 topic folders. Per folder: manual **test-script workbooks (`.xlsx`)** named by Jira ticket (`CLNZ-###`, `AR2021 ##`, `NZWOW ##`, `NZEH-###`, `SNZT3-###`), plus **user-story PDFs**, **business-rules/UI walkthrough `.docx`**, and some **`.zip`** bundles ("Scripts etc", "Business Lump Sum"). Many xlsx embed screenshots as evidence.
- **Sensitivity:** _(TBC — confirm with owner before treating as shareable; no credentials seen in the 2 sampled files, but not all files reviewed.)_

## NOTE: only 2 files sampled (deliberate — large set, convention is consistent)

Sampled `Mel_Kids Cover/CLNZ-771 Kids Cover Business Rules and Validations.xlsx` and
`Mel_Needlestick Cover test cases/CLNZ-832 Needlestick UI Results.xlsx`. Both share an identical
house style, so the rest were not read to save time/tokens. Read more only if a specific file is
needed.

## Client manual-test convention (learned from the sample)

- **One workbook per Jira ticket**, named `<TICKET> <Feature> Business Rules & Validations` (or `... UI Results`).
- **Sheets:** a master `Script` sheet + one sheet **per AC sub-case** (`AC1a`, `AC1b`, `AC2a`, `AC6`…),
  letter suffixes = scenario variants of the same AC. Per-AC sheets hold evidence incl. embedded screenshots.
- **Every Script uses 6 columns:** `Test Case | Acceptance Criteria | Action | Expected Result | Pass/Fail | Comments`.
- **Acceptance Criteria** written in **GIVEN/WHEN/THEN** (Gherkin) — same style as the user stories.
- **Action** = numbered manual UI steps ("- Select Kids Cover Sum Insured drop down box").
- **Expected Result** = literal expected outcome / exact error string (e.g. "The maximum age next birthday for Kids Cover is 21").
- **Pass/Fail** = literal "PASS" (manual verdict). **Comments** = notes / caveats.
- **Validations & error messages** are quoted verbatim, incl. conditional logic ("IF ANB > 21 then …").
- **Versioning/authorship:** via file metadata (author, created/modified dates) + the Jira ticket ID as the anchor — not tracked inside the sheet.

This convention is the basis for the standards-alignment comparison against our
`TEST-GENERATION-PROCESS.md` (see the analysis the assistant produces separately).

## OneDrive_3_09-09-2026 folder (added 2026-09-09) — NEWER, more mature material

A second export with the client's **current (2025-2026) test-case authoring**, more useful than OneDrive_2:

- **`Asteron Connect_User Stories_TC_Mapping Status.xlsx`** — a traceability/coverage tracker (by
  Ranjitha/Prabhakar/Manjunath/Yashwi; created 2025-09, mod 2026-01). Columns:
  `# | User Story | Confluence Link | TC Sheet | TC Status | Steel Thread (Yes/No) | Comments | Test Execution Set | Comment | Assigned To`.
  Maps each user story to its **ACB-#### Jira ID** (same IDs as our user stories) and openly records
  their OWN AC gaps, e.g.: Online Quoting Tool ACB-5956 "3 ACs but only 2 TCs — missing AC3"; In
  Progress Table ACB-5979 "17 ACs, only 13 TCs"; Save Quote ACB-6023 "13 ACs, only 11 TCs"; Personal
  Life ACB-6103 "22 ACs, only 9 TCs". Confirms user stories were UPDATED (more ACs added) since the
  older OneDrive_2 material — likely source of the "stale rule" deltas.
- **Per-feature TC workbooks** (newer format, generated via `openpyxl`): columns
  `TCID | Summary | Description | Action | Expected Result | Priority Name | Label | Assignee ID | Test Type`
  — a Jira/Xray import shape (Test Type=Manual, Label=Digital_Quote_And_Apply). TCs numbered TC_1, TC_2…
  Files match our specs: Occupational Codes, Multiple Lives, Clone Quote, TPD (ACB-7090), Trauma
  (ACB-7089), Specific Injury, Loadings, Lump Sum Life; plus versioned masters `Asteron Test Cases v0.4`
  / `Steelthread_final v0.8`.
- **KEY: `User Story - Occupational Codes Test cases.xlsx` contains the named-occupation → code mapping**
  we DEFERRED (Actuary-Unqualified→A1, Nurse-Dental→A2, Teacher-Principal→AA, Surgeon→AM, Beekeeper→B,
  Painter→C, Private Investigator→IC…), sourced from `TELFR_OCCUPATION.xlsx`. This is the names→codes
  reference our occupational-codes-v1 deferral said it needed — that deferral is now unblockable.

Sampled 3 files total (Kids, Needlestick, Occupational Codes TC + the mapping tracker); rest not read.
