# Summary & Payment

> Child of [Apply Flow](../page.md). Rule ID prefix: `SUM-`. See the [confidence note](../page.md) on this section.

Step 6 is five sequential sub-pages: Underwriting Decision → Owner and Address Detail → Payment → Submit Application → Next Steps.

## Underwriting Decision

| Rule ID | Element | Description |
|---|---|---|
| `SUM-01` | Outcome banner | Displays the underwriting result: Accepted / Declined / Referred / Deferred |
| `SUM-02` | Summary table | Columns: Product, Benefit, Benefit Amount, Premium, Frequency, Underwriting Assessment |
| `SUM-03` | Link applications | Toggle to link multiple applications to the same commencement date |
| `SUM-04` | Attach files | See File Attachment Rules below |

**File Attachment Rules** (applies here and on the Payment page): max **10 MB** per file, max **60-character** filename, accepted formats **pdf / tiff / tif / jpeg / jpg / png**.

## Owner and Address Detail

| Rule ID | Element | Type | Description |
|---|---|---|---|
| `SUM-05` | Policy Owner | Dropdown + Add button | Select an existing registered party, then click Add |
| `SUM-06` | Create New (Owner) | Button | Opens a form to create a new contact as a policy owner |
| `SUM-07` | Address for Correspondence | Dropdown | Select an existing registered party's address |
| `SUM-08` | Create New (Address) | Button | Opens a form to create a new correspondence address |

| Rule ID | Rule |
|---|---|
| `SUM-09` | **Critical:** selecting a name in the Policy Owner dropdown does **not** add them — the **Add** button must be explicitly clicked. Clicking Next without doing so produces: *"At least one owner must be added to the policy."* |

## Payment

| Rule ID | Field | Type | Options |
|---|---|---|---|
| `SUM-10` | Payment Method | Dropdown | Credit Card / Direct Debit |

**Product assignment table columns:** Policy/Product name, Owner(s), Illustrated Premium, Payment Frequency and Date, Payment Method (an **"Apply to Policy"** button assigns the chosen method to that product row).

| Rule ID | Rule |
|---|---|
| `SUM-11` | The **Apply to Policy** button must be clicked per product row before that row's payment-details form appears. |
| `SUM-12` | **Credit Card** uses an external **QuickStream** cross-domain iframe (card number, expiry, CVV) — this is a third-party-hosted payment page, out of scope for direct testing/automation of this application's own form. |

### Direct Debit details

| Rule ID | Field | Type | Format |
|---|---|---|---|
| `SUM-13` | Bank Name | Text | Free text |
| `SUM-14` | Account Name | Text | Free text |
| `SUM-15` | Bank code | Text | 2 digits (e.g. 06) |
| `SUM-16` | Branch code | Text | 4 digits (e.g. 0141) |
| `SUM-17` | Account Number (main) | Text | 7 digits |
| `SUM-18` | Account Number (suffix) | Text | 2 digits |
| `SUM-19` | DD Confirmation checkbox | Checkbox | *"I confirm that all required signatories for the nominated bank account have agreed to Asteron Life's direct debit terms and conditions..."* |

NZ bank account format: `BB-BBBB-AAAAAAA-SS` (bank–branch–account–suffix).

| Rule ID | Rule |
|---|---|
| `SUM-20` | NZ banks validate the bank/branch/account combination via a **backend modulus check** — a syntactically-valid-looking but fake combination will be rejected with *"Bank & Branch and Account Number combination entered is not valid."* Test data must use a real, valid bank/branch/account combination. |

Controls: Cancel / Submit.

## Submit Application

| Rule ID | Rule |
|---|---|
| `SUM-21` | **Access gate:** requires payment to have been successfully submitted first — direct URL navigation here is blocked and redirects back to the earliest incomplete step. |

Provides a final summary and confirmation before formal submission to Asteron Life.

## Next Steps

| Rule ID | Rule |
|---|---|
| `SUM-22` | **Access gate:** requires Submit Application to have completed successfully. |

Displays post-submission information: next steps, expected processing timeline, confirmation details.
