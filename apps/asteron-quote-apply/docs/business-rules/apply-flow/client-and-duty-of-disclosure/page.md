# Client Details & Duty of Disclosure

> Child of [Apply Flow](../page.md). Rule ID prefix: `CD-`. See the [confidence note](../page.md) on this section.

## Step 2 — Client (Personal Details)

Reviews and confirms the personal details captured during quoting; fields are pre-populated from the Quote screen and can be amended.

| Rule ID | Field | Type | Required |
|---|---|---|---|
| `CD-01` | First Name | Text | No |
| `CD-02` | Last Name | Text | No |
| `CD-03` | Date of Birth | Date picker | **Yes** |
| `CD-04` | Age Next Birthday | Number, auto-calculated | **Yes** |
| `CD-05` | Gender | Button group (Male/Female) | No |
| `CD-06` | Smoking Status | Button group (Yes/No) | No |
| `CD-07` | Occupation | Searchable type-ahead | No |
| `CD-08` | Occupation Code | Select | No |
| `CD-09` | Employment Status | Select | **Yes** |

## Step 3 — Duty of Disclosure

A multi-section informational page the adviser must confirm before proceeding.

| Rule ID | Section | Content |
|---|---|---|
| `CD-10` | Why accurate information matters | Narrative explaining why Asteron Life needs accurate information: to assess future claims, price premiums appropriately, and sustain the business. |
| `CD-11` | Duty to disclose | Must disclose **all** material information (occupation, medical history, health, habits, finances) — proactively, not just in response to direct questions. Also covers any material **change in circumstances** from submission until policy issuance, and applies equally when extending, altering, or reinstating a lapsed policy. Risks of non-disclosure: claims may not be paid, the policy may be cancelled/voided, future insurance may become unavailable, other financial hardship. |
| `CD-12` | Privacy statement | Asteron Life complies with the Privacy Act. Personal information is used to process/underwrite/reinsure/accept applications, service policies and process claims, and monitor ongoing insurance requirements. May be disclosed to third parties for service delivery or legal compliance (including newly appointed advisers); stored securely in NZ or overseas. Records access/correction: Customer Service, 0800 737 101 / contactus@asteronlife.co.nz / PO Box 894, Wellington. |
| `CD-13` | Financial Strength Rating | **A+ (Strong)**, rated by Fitch Australia Pty Ltd — indicates a strong capacity to meet policyholder and contractual obligations. |

### Confirmation field

| Rule ID | Field | Type | Required |
|---|---|---|---|
| `CD-14` | Adviser Confirmation — *"I confirm that I have made the person to be insured and policy owner(s) aware of their duty of disclosure, our privacy statement and FSR disclosure as outlined above and they have confirmed to me that they have understood their Duty of Disclosure."* | Button group (Yes/No) | **Yes** |

| Rule ID | Rule |
|---|---|
| `CD-15` | Adviser Confirmation is the **only** interactive field on this page. It must be Yes for the Next button to advance to Step 4. |
