# Asteron Life Quote & Apply — Form Business Rules

> **Source:** DOM-first Playwright extraction from `https://outsystems-dev.asteronlife.co.nz/QuoteAndApply/`  
> **Extracted:** 2026-08-04  
> **Method:** Kiro CLI + Playwright MCP browser automation  
> **Coverage:** Full end-to-end — Quote form + complete Apply flow

---

## Table of Contents

**QUOTE FORM**
1. [Personal Details (Quote)](#1-personal-details-quote)
2. [Policy-level Settings](#2-policy-level-settings)
3. [Lump Sum Covers](#3-lump-sum-covers)
4. [Disability Covers](#4-disability-covers)
5. [Kids Cover](#5-kids-cover)
6. [Premium Section](#6-premium-section)

**APPLY FLOW**
7. [Apply Flow Overview](#7-apply-flow-overview)
8. [Step 2 — Client (Personal Details)](#8-step-2--client-personal-details)
9. [Step 3 — Duty of Disclosure](#9-step-3--duty-of-disclosure)
10. [Step 4 — Insurance & Financial Details](#10-step-4--insurance--financial-details)
11. [Step 4 — Tele Interview](#11-step-4--tele-interview)
12. [Step 5 — Personal Statement](#12-step-5--personal-statement)
13. [Step 6 — Summary & Payment](#13-step-6--summary--payment)

**REFERENCE**
14. [Validation Rules](#14-validation-rules)
15. [Discount & Business Rules](#15-discount--business-rules)
16. [Automation Notes](#16-automation-notes)

---

## 1. Personal Details (Quote)

| Field | Type | Options / Notes | Required |
|-------|------|-----------------|----------|
| First Name | Text input | Free text | No |
| Last Name | Text input | Free text | No |
| Date of Birth | Date picker | — | Yes |
| Age Next Birthday | Number | Auto-calculated from DOB | Yes |
| Gender | Button group | Male / Female | No |
| Smoking Status (incl. vapes & e-cigarettes) | Button group | Yes / No | No |
| Occupation | React Select (searchable) | Searchable lookup | No |
| Occupation Code | Dropdown | AM / AA / A1 / A2 / B / C / S / U / IC | No |
| Employment Status | Dropdown | Employed / Self-Employed / Employed by own company / Other | **Yes** — blocks Apply |
| Pre-tax Annual Income ($) | Masked number | Includes salary, commissions, KiwiSaver, fringe benefits | No |

**Tooltip — Pre-tax Annual Income:**
> Annual income can include salary, wages, packaged fringe benefits, commissions, bonuses and company superannuation contributions e.g KiwiSaver. For the self-employed it's the insured's share of the net profit (or loss) of the business, derived from their own personal exertion (after deduction of all business expenses, including depreciation), but before tax.

---

## 2. Policy-level Settings

These settings apply across all covers in the policy.

| Field | Type | Options | Default | Notes |
|-------|------|---------|---------|-------|
| Inflation Adjustment Benefit | Checkbox | On/Off | **On** | — |
| Premium Freeze | Checkbox | On/Off | Off | — |
| We Pay Your Premiums | Dropdown | None / 30 days / 60 days / 90 days | None | Waives lump sum premiums if insured cannot work >10 hrs/week after wait period |
| Flexi Rate | Dropdown | N/A / 2.5% to 30.0% (0.5% steps) | N/A | Reduces Adviser commission to discount client premium |

---

## 3. Lump Sum Covers

Covers are added by clicking cover buttons in the "Lump Sum Covers" panel.  
**Activation pattern:** `eval` → `button.click()` (standard Playwright click does not trigger OutSystems XHR).

### 3.1 Life Cover A

| Field | Type | Options |
|-------|------|---------|
| Sum Insured ($) | Calc-mask input | Free-form — right-to-left digit entry |
| Premium Structure | Dropdown | Stepped / Level to 50 / Level to 60 / Level to 65 / Level to 70 / Level to 75 / Level to 80 / Level to 100 |

**Sub-cover buttons:** TI Support · Acc. TPD · Acc. Trauma · Acc. Cancer

**Discount bands:**  
$150k–$199k / $200k–$249k / $250k–$299k / $300k–$349k / $350k–$399k / $400k–$499k / $500k–$749k / $750k–$999k / $1,000k+

---

### 3.2 TI Support *(sub-cover of Life)*

| Field | Type | Options | Constraint |
|-------|------|---------|------------|
| Sum Insured ($) | Calc-mask input | — | Max 100% of Life Cover SI; absolute max $300,000 |
| Premium Structure | Dropdown | **Stepped only** | — |

> Pays the Terminal Illness Support Benefit sum insured if diagnosed as terminally ill with less than 24 months to live.

---

### 3.3 Accelerated TPD *(sub-cover of Life)*

| Field | Type | Options |
|-------|------|---------|
| Sum Insured ($) | Calc-mask input | — |
| Premium Structure | Dropdown | **Stepped only** |
| Definition | Dropdown | Own / Any / Modified |

---

### 3.4 TPD A

| Field | Type | Options |
|-------|------|---------|
| Sum Insured ($) | Calc-mask input | — |
| Premium Structure | Dropdown | Stepped / Level to 65 / Level to 70 |
| Definition | Dropdown | Own / Any / Modified |

**Discount bands:** $100k–$249k / $250k–$499k / $500k+

---

### 3.5 Trauma A

| Field | Type | Options |
|-------|------|---------|
| Sum Insured ($) | Calc-mask input | — |
| Premium Structure | Dropdown | Stepped / Level to 65 / Level to 70 |
| Early Trauma Benefit | Checkbox | On/Off (default: **Off**) |
| Trauma Reinstatement | Checkbox | On/Off (default: **Off**) |
| Continuous Trauma Benefit | Checkbox | On/Off (default: **Off**) |

**Sub-cover buttons:** Major Trauma · TPD on Trauma

**Checkbox rules:**

| Benefit | Description |
|---------|-------------|
| Early Trauma Benefit | Partial payment for 20 additional less-severe conditions. Pays greater of $10,000 or 20% of TRC sum insured, max $100,000 |
| Trauma Reinstatement | Reinstates TRC 12 months after a claim. Requires sufficient Life Cover or Life Cover buy-back benefit selected |
| Continuous Trauma Benefit | Continuous cover after claim. Automatically reinstates sum insured immediately after each claim; up to 3 full trauma claims per person |

**Discount bands:** $100k–$249k / $250k–$499k / $500k+

---

### 3.6 Cancer A

| Field | Type | Options |
|-------|------|---------|
| Sum Insured ($) | Calc-mask input | — |
| Premium Structure | Dropdown | Stepped / Level to 65 / Level to 70 |

> Provides additional money over and above the Trauma Recovery sum insured for cancer conditions and includes the Early stage cancer benefit.

**Discount bands:** $100k–$249k / $250k+

---

### 3.7 Accidental Death A

| Field | Type | Options |
|-------|------|---------|
| Sum Insured ($) | Calc-mask input | — |
| Premium Structure | Dropdown | Stepped / Level to 50 / Level to 60 / Level to 65 / Level to 70 / Level to 75 / Level to 80 / Level to 100 |

**Discount bands:** $150k–$249k / $250k–$499k / $500k–$999k / $1,000k+

---

### 3.8 Needlestick A

| Field | Type | Options |
|-------|------|---------|
| Sum Insured ($) | **Dropdown** (fixed steps) | $0 / $50,000 / $100,000 / … / $500,000 (11 options, $50k steps) |
| Premium Structure | Dropdown | Stepped / Level to 50 / Level to 60 / Level to 65 / Level to 70 / Level to 75 / Level to 80 / Level to 100 |

> For certain occupations — provides additional financial protection against contracting hepatitis B, hepatitis C, or HIV.

---

### 3.9 Specific Injury A

| Field | Type | Options |
|-------|------|---------|
| Sum Insured ($) | Calc-mask input | — |
| Premium Structure | Dropdown | Stepped / Level to 50 / Level to 60 / Level to 65 / Level to 70 / Level to 75 / Level to 80 / Level to 100 |

> Pays a multiple of the sum insured for specified injuries suffered as a result of an accident. **Must be purchased with at least one eligible Personal Insurance cover.**

---

## 4. Disability Covers

Covers activated by the same button-click eval pattern. All show Monthly Benefit as a calc-mask input.

### 4.1 Mortgage & Living

| Field | Type | Options | Default |
|-------|------|---------|---------|
| Cover Type | Dropdown | Annual Income / Monthly Mortgage | — |
| Monthly Benefit ($) | Calc-mask input | — | — |
| Premium Structure | Dropdown | Stepped / Level to Expiry | Stepped |
| Offset Benefit | Dropdown | Agreed Value / Agreed Value Plus | Agreed Value Plus |
| Benefit Period | Dropdown | 2 Years / 5 Years / To Age 65 / To Age 70 | To Age 65 |
| Waiting Period | Dropdown | 14 Days / 30 Days / 60 Days / 90 Days / 180 Days / 365 Days / 730 Days | 30 Days |

**Option buttons:**

| Button | Description |
|--------|-------------|
| Increasing Claim | — |
| Income Top-up Package | Income booster (+33% for first 3 months on full claim) + 25% income bonus when partially back at work |
| Specific Injury Support Benefit | Monthly multiple for specified accident injuries; Living/Homemaker Support not payable concurrently |
| Immediate Assist Package | Bed-Confinement (daily benefit during waiting period) + Crisis Benefit for 11 specified conditions (bypasses waiting period) |
| Ten-Hour Benefit | Work up to 10 hours/week without affecting Living support benefit |
| Mental Health Discount | — |
| Split Benefit | Splits monthly benefit into two sum insureds (different waiting periods or top-up) |

---

### 4.2 Income Protection

| Field | Type | Options | Default |
|-------|------|---------|---------|
| Policy Type | Dropdown | Loss Of Earnings / Loss Of Earnings Plus | Loss Of Earnings Plus |
| Monthly Benefit ($) | Calc-mask input | — | — |
| Premium Structure | Dropdown | Stepped / Level to Expiry | Stepped |
| Benefit Period | Dropdown | 2 Years / 5 Years / To Age 65 / To Age 70 | To Age 65 |
| Waiting Period | Dropdown | 14 Days / 30 Days / 60 Days / 90 Days / 180 Days / 365 Days / 730 Days | 30 Days |

**Option buttons:** Increasing Claim · Income Top-up Package · Specific Injury Support Benefit · Immediate Assist Package · Mental Health Discount · Split Waiting Period

---

### 4.3 Workability

| Field | Type | Options | Default |
|-------|------|---------|---------|
| Monthly Benefit ($) | Calc-mask input | — | — |
| Premium Structure | Dropdown | Stepped / Level to Expiry | Stepped |
| Benefit Period | Dropdown | To Age 65 / To Age 70 | To Age 65 |
| Waiting Period | Dropdown | 30 Days / 45 Days / 60 Days / 75 Days / 90 Days | 30 Days |

**Option buttons:** Increasing Claim

> Workability has a narrower Benefit Period and Waiting Period range compared to Mortgage & Living and Income Protection.

---

## 5. Kids Cover

| Field | Type | Options | Default |
|-------|------|---------|---------|
| Number of Kids | Dropdown | 0 / 1 / 2 / 3 / 4 / 5 / 6 / 7 / 8 / 9 | 0 |

---

## 6. Premium Section

| Field | Type | Options | Default |
|-------|------|---------|---------|
| Payment Frequency | Dropdown | Fortnightly / Monthly / Quarterly / Half Yearly / Yearly | Monthly |
| Total Monthly Premium | Display (read-only) | Calculated | — |
| Total Yearly Premium | Display (read-only) | Calculated (monthly × 12 or half-yearly × 2) | — |

---

---

# APPLY FLOW

---

## 7. Apply Flow Overview

The Apply flow is triggered by clicking the **Apply** button on the Quote form. It opens in the same tab (after patching `window.open`) and progresses through the following steps:

| Step | Screen | URL Pattern |
|------|--------|-------------|
| 1 | Quote | `/QuoteAndApply/Quote?QuoteId=...` |
| 2 | Client (Personal Details) | `/QuoteAndApply/Client?ApplicationId=...` |
| 3 | Duty of Disclosure | `/QuoteAndApply/DutyOfDisclosure?ApplicationId=...` |
| 4a | Insurance History | `/QuoteAndApply/InsuranceHistory?ApplicationId=...` |
| 4b | Occupation Details | `/QuoteAndApply/OccupationDetails?ApplicationId=...` |
| 4c | Financial Details | `/QuoteAndApply/FinancialDetails?ApplicationId=...` |
| 4d | Tele Interview | `/QuoteAndApply/TeleInterview?ApplicationId=...` |
| 5 | Personal Statement (7 pages) | `/QuoteAndApply/PersonalStatement?p=1–7&ApplicationId=...` |
| 6a | Underwriting Decision | `/QuoteAndApply/UnderwritingDecision?ApplicationId=...` |
| 6b | Owner & Address Detail | `/QuoteAndApply/OwnerAndAddressDetail?ApplicationId=...` |
| 6c | Payment | `/QuoteAndApply/Payment?ApplicationId=...` |
| 6d | Submit Application | `/QuoteAndApply/SubmitApplication?ApplicationId=...` |
| 6e | Next Steps | `/QuoteAndApply/NextSteps?ApplicationId=...` |

**Navigation rules:**
- Steps are enforced sequentially — direct URL navigation to a later step redirects to the earliest incomplete step.
- Each sub-step within step 4 and step 6 has its own page with Previous/Next footer navigation.
- Clicking Next on any page validates the current page and proceeds only if validation passes.

---

## 8. Step 2 — Client (Personal Details)

This page reviews and confirms the personal details captured during quoting. Fields are pre-populated from the Quote form and can be amended.

| Field | Type | Options / Notes | Required |
|-------|------|-----------------|----------|
| First Name | Text input | Free text | No |
| Last Name | Text input | Free text | No |
| Date of Birth | Date picker | — | Yes |
| Age Next Birthday | Number | Auto-calculated | Yes |
| Gender | Button group | Male / Female | No |
| Smoking Status | Button group | Yes / No | No |
| Occupation | React Select (searchable) | — | No |
| Occupation Code | Dropdown | AM / AA / A1 / A2 / B / C / S / U / IC | No |
| Employment Status | Dropdown | Employed / Self-Employed / Employed by own company / Other | Yes |

---

## 9. Step 3 — Duty of Disclosure

A multi-section informational page the adviser must confirm before proceeding.

### 9.1 Why Accurate Information Matters

Full narrative text explaining why Asteron Life needs accurate information to: assess future claims, price premiums appropriately, and sustain the business.

### 9.2 Duty to Disclose

Key obligations:
- Disclose **all** material information relevant to the application — occupation, medical history, health, personal habits, finances.
- Answer all questions accurately; proactively disclose even if not asked.
- Disclose any **change in circumstances** that is material from form submission until policy issuance.
- Duty also applies when extending, altering, or reinstating a lapsed policy.

**Risks of non-disclosure:**
- Claims may not be paid
- Policy may be cancelled or treated as void
- Future insurance may be unavailable
- Other financial hardship

### 9.3 Privacy Statement

Asteron Life Limited complies with the Privacy Act. Personal information is used to:
1. Process, underwrite, reinsure, and accept applications
2. Service and maintain policies; process claims
3. Monitor and service ongoing insurance requirements

Information may be disclosed to third parties for service delivery or legal compliance, including newly appointed advisers. Stored securely in NZ or overseas. Contact Customer Service to access/correct records: 0800 737 101 / contactus@asteronlife.co.nz / PO Box 894, Wellington.

### 9.4 Financial Strength Rating

**A+ (Strong)** — rated by Fitch Australia Pty Ltd (Fitch). This means Asteron Life has a strong capacity to meet policyholder and contractual obligations.

### 9.5 Confirmation Fields

| Field | Type | Description | Required |
|-------|------|-------------|----------|
| Adviser Confirmation | Button group (Yes/No) | "I confirm that I have made the person to be insured and policy owner(s) aware of their duty of disclosure, our privacy statement and FSR disclosure as outlined above and they have confirmed to me that they have understood their Duty of Disclosure." | Yes |

> **Note:** The adviser confirmation is the only interactive field on this page. Clicking Yes is required to proceed. The Next button in the footer advances to step 4.

---

## 10. Step 4 — Insurance & Financial Details

Step 4 contains three sequential pages (Insurance History → Occupation Details → Financial Details) plus Tele Interview. Each page has Previous/Next navigation.

### 10.1 Insurance History

| # | Question | Type | Options |
|---|----------|------|---------|
| 1 | Have you ever had or applied for any insurance cover with Asteron Life or AA Life? | Radio (Yes/No) | Yes / No |
| 2 | Other than this application, do you currently have, or are you currently applying for, any Life or Accidental Death benefit insurance? | Radio (Yes/No) | Yes / No |

**Conditional fields (if Yes to question 2):**

| Field | Type | Notes |
|-------|------|-------|
| Details of existing cover | Text/amount fields | Provider name, cover type, benefit amount |

---

### 10.2 Occupation Details

| # | Question | Type | Options |
|---|----------|------|---------|
| 1 | As part of your job, are you involved in any of the following? | Radio (Yes/No) | Yes / No |

**Conditional checkboxes (if Yes):**

| Checkbox Option | Description |
|----------------|-------------|
| Working underground in a mine or tunnel | — |
| Working at heights in excess of 10 metres | — |
| Working offshore or at sea or underwater | — |
| Working with or handling dangerous substances or chemicals | — |
| Working with or handling weapons or explosives | — |
| Other hazardous duties | Free-text detail required |

---

### 10.3 Financial Details

| Field | Type | Notes | Required |
|-------|------|-------|----------|
| Annual earned income | Masked currency input | Gross annual income | Yes |

> This value is used for underwriting income replacement calculations. It may differ from the Pre-tax Annual Income on the Quote form.

---

## 11. Step 4 — Tele Interview

| Field | Type | Options | Notes |
|-------|------|---------|-------|
| Would you like to use our tele-interview service? | Button group (Yes/No) | Yes / No | If Yes, a scheduling interface or contact details are provided for the insured to complete their Personal Statement by phone rather than online |

---

## 12. Step 5 — Personal Statement

The Personal Statement is a 7-page medical and lifestyle questionnaire. All questions are **Yes/No radio buttons** unless otherwise noted. Answering **Yes** to most questions reveals follow-up sub-questions or free-text detail fields.

**Navigation pattern:** Each page has Previous/Next footer buttons. The application tracks unanswered questions and surfaces them via an "Unanswered Questions" summary before allowing progression to the Underwriting Decision.

---

### Page 1 — Mental Health

| # | Question | Type |
|---|----------|------|
| 1 | Have you ever been admitted to hospital or referred to a psychiatrist for a mental health condition or eating disorder? | Yes/No |
| 2 | Have you ever had any symptoms of, been diagnosed with, or received treatment for: depression, anxiety, stress, panic attacks, eating disorder, or any other mental health condition? | Yes/No |

---

### Page 2 — Physical Health (Ever)

*"Have you ever had, been diagnosed with, or received treatment for any of the following?"*

| # | Condition Group |
|---|----------------|
| 1 | Disease or disorder of the heart or blood vessels (heart attack, heart murmur, angina, chest pain, irregular heartbeat, heart valve disorder, peripheral vascular disorder) |
| 2 | Stroke, mini-stroke (TIA), brain haemorrhage or aneurysm, brain injury or disorder, bleeding within the skull |
| 3 | Epilepsy, seizures, fainting attacks, or fits |
| 4 | Diabetes, pre-diabetes, impaired glucose tolerance, or abnormal blood sugar |
| 5 | HIV, AIDS, or autoimmune disease (Lupus SLE, Scleroderma, CREST syndrome) |
| 6 | Crohn's disease, Ulcerative colitis, Barrett's oesophagus, Polycystic kidney disease (PKD), Cirrhosis, Hepatitis B or C |
| 7 | Any cancer, skin cancer, early-stage cancer, or carcinoma in situ (Hodgkin's disease, lymphoma, leukaemia, melanoma) |
| 8 | Any benign tumour, growth, cyst, or lump in the breast, lungs, brain, or spine |
| 9 | Any condition of the back, spine, or neck (consulted a physiotherapist, chiropractor, or osteopath; back/neck pain, sciatica, whiplash) |
| 10 | Multiple Sclerosis, paralysis, or other neurological disease or disorder (Parkinson's, Alzheimer's, Dementia, Cerebral palsy, Muscular dystrophy, Motor neurone disease) |

---

### Page 3 — Physical Health (In the Last 5 Years)

*"In the last 5 years, have you had, been diagnosed with, or received treatment for any of the following?"*

| # | Condition Group |
|---|----------------|
| 1 | Raised blood pressure (hypertension) or raised cholesterol |
| 2 | Sleep apnoea, asthma, or any other lung or breathing condition (COPD, emphysema, sarcoidosis, chronic bronchitis, tuberculosis) |
| 3 | Chronic fatigue, sustained poor sleep or lack of energy, current or recurrent long Covid |
| 4 | Anaemia, haemophilia, haemochromatosis, DVT (deep vein thrombosis), or any other blood, bleeding, or connective tissue disorder |
| 5 | Fibromyalgia, osteoporosis, gout, regional pain syndrome, Ehlers-Danlos Syndrome, or any form of arthritis |
| 6 | Any fractured or broken bone |
| 7 | Any condition affecting bones, joints, muscles, ligaments, tendons, or limbs (physiotherapy, soft tissue or cartilage tears, overuse injury) |
| 8 | Any gastro-intestinal tract disease or disorder (coeliac disease, hiatus hernia, IBS, ulcers, bowel polyps, weight loss surgery, blood from bowel, vomiting blood) |
| 9 | Any disease or disorder of the kidney, bladder, or urinary tract (kidney stones, recurrent UTIs, blood or protein in urine, abnormal kidney function tests) |
| 10 | Any disease or disorder of the liver or gall bladder (fatty liver, raised liver function tests, gallstones) |
| 11 | Any disease or disorder of the thyroid, pancreas, or any other glandular condition (hypothyroidism, hyperthyroidism, pancreatitis, Addison's disease) |
| 12 | Loss of feeling or reduced muscle power, balance/coordination problems, tremor, numbness, pins and needles, dizziness, migraines, or recurring headaches |
| 13 | Any condition affecting ears/hearing or eyes/vision (tinnitus, Menière's disease, labyrinthitis, glaucoma, optic neuritis, blurred or double vision) |
| 14 | Skin spots or moles that have bled, changed, or become painful; any other cyst, lump, growth, or benign tumour |
| 15 | Any disease or disorder of the reproductive system (e.g. testicles or prostate; not including infertility or erectile dysfunction) |

---

### Page 4 — Other Medical History

| # | Question | Type | Timeframe |
|---|----------|------|-----------|
| 1 | Consulted, or been advised to consult, any medical professional for any other sickness, injury, impairment, procedure, or syndrome? | Yes/No | Last 3 years |
| 2 | Had any surgery, been admitted overnight to hospital, or been asked to have any tests or investigations at a hospital or specialist clinic? | Yes/No | Last 3 years |
| 3 | Had any other condition that has caused you to be absent from work, or unable to perform your daily activities, for more than 2 weeks at a time? | Yes/No | Last 3 years |
| 4 | Currently receiving any counselling, or taking any medication or treatment for any other condition on a regular basis? | Yes/No | Current |
| 5 | Currently waiting for a referral, investigation, results, operation, or any other treatment for any other condition? | Yes/No | Current |
| 6 | Any of the following symptoms: unexplained weight loss; recurrent nausea or vomiting; unexplained memory loss, confusion, or change in movement; cough lasting 3 or more weeks; unexplained shortness of breath? | Yes/No | Last 12 months |
| 7 | Any of the following symptoms: persistent or recurrent fatigue, dizziness, numbness, weakness, pins and needles, or tremor; any other recurrent or unusual pain, discomfort, or bleeding; any symptom you are planning to consult a doctor about for the first time? | Yes/No | Last 12 months |

---

### Page 5 — Family History

*"Have any of your biological parents, brothers, or sisters been diagnosed with any of the following conditions before the age of 60?"*

**Field type:** Multi-select checkboxes (select all that apply). Must select at least one option.

| Option |
|--------|
| Don't know as I am adopted |
| Bowel or colon cancer |
| Breast and/or ovarian cancer |
| Another type of cancer (not breast, ovarian, bowel, or colon) |
| Alzheimer's disease or dementia |
| Angina, heart attack, heart disease and/or stroke |
| Diabetes |
| Familial adenomatous polyposis (FAP) or another hereditary bowel condition |
| Haemochromatosis |
| Huntington's disease (Chorea) |
| Motor neurone disease |
| Multiple Sclerosis |
| Muscular dystrophy |
| Parkinson's disease |
| Polycystic kidney disease (PKD) |
| Other condition running in the family for which you have received or been offered screening |
| **None of the above** |

> **Automation note:** Checkboxes here require `scrollIntoView({block:"center"})` on the input element followed by `mouse-click` at viewport coordinates. Standard `label.click()` via eval does NOT register with OutSystems DOM binding.

---

### Page 6 — Underwriting Assessments & Claims

| # | Question | Type | Timeframe |
|---|----------|------|-----------|
| 1 | Has any application for any type of insurance been declined or deferred? | Yes/No | Last 5 years |
| 2 | Has any application for insurance been offered with modified terms (loadings or exclusions)? | Yes/No | Last 12 months |
| 3 | Are you currently receiving a WINZ or ACC benefit, making a claim on an insurance policy, or expecting to receive the first payment of a claim? | Yes/No | Current |
| 4 | Other than anything already stated, have you previously made a claim on an insurance policy or received a WINZ or ACC benefit? | Yes/No | Last 5 years |

---

### Page 7 — Residence, Activities & Lifestyle

#### Residence and Travel

| # | Question | Type | Options |
|---|----------|------|---------|
| 1 | Are you a New Zealand citizen or do you hold a New Zealand permanent resident visa? | Radio (Yes/No) | Yes / No |
| 1a | How long have you lived in New Zealand? | Dropdown (conditional — shown only if No to Q1) | Less than 4 months / 4–6 months / 7–12 months / More than 12 months but less than 3 years / 3–5 years / Over 5 years |
| 2 | Do you plan to live, work, or travel outside of New Zealand or Australia in the next 12 months? | Radio (Yes/No) | Yes / No |

#### Pursuits, Sports and Activities

| # | Question | Type | Conditional Checkboxes (shown if Yes) |
|---|----------|------|---------------------------------------|
| 3 | Do you participate in any of the following activities? | Radio (Yes/No) | Flying or any aerial activity (hang gliding, paragliding, micro-lighting, parachuting & skydiving); Motor car or motorcycle sport; Mountaineering or rock climbing (excluding artificial walls); Powerboat racing; Caving or potholing; Diving over 30 metres or solo |
| 4 | Do you participate in any of the following activities? | Radio (Yes/No) | Ocean racing or long-distance open ocean sailing; Horse riding (other than private hacking); Rugby or football (union, league, Australian rules, American football & Soccer); Full contact martial arts, combat sport or boxing; Any extreme sport (bungee jumping, canyoning, white water rafting, heli-skiing, competitive BMX or mountain biking); Any professional or semi-professional sport not already stated |

#### Lifestyle and Medical History

| # | Question | Type | Options |
|---|----------|------|---------|
| 5 | Have you used any tobacco or nicotine products, including e-cigarettes, in the last 12 months? | Select dropdown | Please select an option / Yes / No |
| 6 | Have you used marijuana or cannabis recreationally in the last 5 years? | Radio (Yes/No) | Yes / No |
| 7 | Have you used any other recreational drugs in the last 10 years (excluding marijuana or cannabis)? | Radio (Yes/No) | Yes / No |
| 8 | How many standard drinks of alcohol do you typically have per week? | Text input (number) | Free numeric entry |
| 9 | Have you ever attended, or been advised to attend, a support service, treatment programme, or counselling for your use of alcohol? | Radio (Yes/No) | Yes / No |

> **Automation note (tobacco field):** The tobacco question uses a `<select>` element, not a radio button or button group. Must use `selectOption` or eval `getElementById().value` then trigger change event. Selecting with standard `fill()` does not bind.

---

## 13. Step 6 — Summary & Payment

Step 6 contains five sequential sub-pages: Underwriting Decision → Owner and Address Detail → Payment → Submit Application → Next Steps.

---

### 13.1 Underwriting Decision

| Element | Description |
|---------|-------------|
| Outcome banner | Displays the underwriting result: Accepted / Declined / Referred / Deferred |
| Summary table | Columns: Product \| Benefit \| Benefit Amount \| Premium \| Frequency \| Underwriting Assessment |
| Link applications | Toggle option to link multiple applications to the same commencement date |
| Attach files | File upload section (see File Attachment Rules below) |

**File Attachment Rules:**
- Max file size: 10 MB per file
- Max filename length: 60 characters
- Accepted formats: pdf / tiff / tif / jpeg / jpg / png

---

### 13.2 Owner and Address Detail

| Element | Type | Description |
|---------|------|-------------|
| Policy Owner | Dropdown + Add button | Select an existing registered party and click Add to add them as a policy owner |
| Create New (Owner) | Button | Opens a form to create a new contact as a policy owner |
| Address for Correspondence | Dropdown | Select an existing registered party's address |
| Create New (Address) | Button | Opens a form to create a new correspondence address |

**Validation:**
- "At least one owner must be added to the policy" — clicking Next without clicking Add triggers this error.

> **Critical:** Selecting a name in the dropdown does NOT automatically add the owner. The **Add** button must be explicitly clicked before proceeding.

---

### 13.3 Payment

#### Payment Method Selection

| Field | Type | Options |
|-------|------|---------|
| Payment Method | Dropdown | Credit Card / Direct Debit |

#### Product Assignment Table

| Column | Description |
|--------|-------------|
| Policy/Product name | Name of the insurance product |
| Owner(s) | Policy owner(s) assigned to this product |
| Illustrated Premium | Premium amount as quoted |
| Payment Frequency and Date | Frequency selection |
| Payment Method | "Apply to Policy" button — assigns the selected payment method to this product row |

> The **Apply to Policy** button must be clicked for each product row before the payment details form is shown for that product.

#### Credit Card Details

Uses an external **QuickStream** iframe (cross-domain). Playwright automation cannot interact with this iframe due to the cross-origin restriction. The iframe renders card number, expiry, and CVV fields hosted by a third-party payment processor.

#### Direct Debit Details

| Field | Element ID | Type | Format |
|-------|-----------|------|--------|
| Bank Name | `b6-Input_BankName` | Text input | Free text |
| Account Name | `b6-Input_AccountName` | Text input | Free text |
| Bank code | `b6-Input_Bank` | Text input | 2 digits (e.g. 06) |
| Branch code | `b6-Input_Branch` | Text input | 4 digits (e.g. 0141) |
| Account Number (main) | `b6-Input_AccountNumber` | Text input | 7 digits (e.g. 0336267) |
| Account Number (suffix) | `b6-Input_AccountNumber2` | Text input | 2 digits (e.g. 00) |
| DD Confirmation | `b6-Checkbox2` | Checkbox | — |

**NZ Bank Account format:** `BB-BBBB-AAAAAAA-SS` (bank code – branch code – account number – suffix)

**DD Confirmation text:** *"I confirm that all required signatories for the nominated bank account have agreed to Asteron Life's direct debit terms and conditions..."*

**Validation:**
- "Bank & Branch and Account Number combination entered is not valid" — NZ banks validate the bank/branch/account combination via backend modulus check. Test accounts must be real valid combinations.

**Controls:** Cancel / Submit buttons

#### File Attachments (Payment page)

Same rules as Underwriting Decision file attachments (10 MB, 60-char filename, pdf/tiff/tif/jpeg/jpg/png).

---

### 13.4 Submit Application

> **Access gate:** Requires payment to be successfully submitted. Direct URL navigation is blocked and redirects to the earliest incomplete step.

This page provides a final summary and confirmation before the application is formally submitted to Asteron Life.

---

### 13.5 Next Steps

> **Access gate:** Requires Submit Application to complete successfully.

This page displays post-submission information including next steps, expected processing timeline, and confirmation details.

---

## 14. Validation Rules

| Trigger | Condition | Message / Effect |
|---------|-----------|-----------------|
| Apply button (Quote form) | Employment Status not selected | "Please complete the client's employment details before applying" |
| Tab/blur from Sum Insured field | Any cover active | **Auto-save triggered** — "Quote saved." toast; bypasses footer Save modal |
| Duty of Disclosure Next | Adviser confirmation not Yes | Cannot proceed — Next button inactive |
| Insurance History Next | Any required question unanswered | Inline validation error on unanswered question |
| Owner & Address Detail Next | No owner added via Add button | "At least one owner must be added to the policy" |
| Direct Debit Submit | Invalid NZ bank account combination | "Bank & Branch and Account Number combination entered is not valid" |
| Personal Statement unanswered | Any question skipped across 7 pages | "Unanswered Questions" summary page surfaced before UnderwritingDecision; each item has an Answer button linking to the specific page |

---

## 15. Discount & Business Rules

### Sum Insured Discount Bands

| Cover | Bands |
|-------|-------|
| Life | $150k–$199k / $200k–$249k / $250k–$299k / $300k–$349k / $350k–$399k / $400k–$499k / $500k–$749k / $750k–$999k / $1,000k+ |
| TPD | $100k–$249k / $250k–$499k / $500k+ |
| Trauma | $100k–$249k / $250k–$499k / $500k+ |
| Cancer | $100k–$249k / $250k+ |
| Accidental Death | $150k–$249k / $250k–$499k / $500k–$999k / $1,000k+ |

### Multi-Cover Bundling Discounts

| Condition | Discount |
|-----------|----------|
| 2 cover types (Personal & Business) | 15% |
| 3 or more cover types | 20% |

### Key Product Rules

| Rule | Detail |
|------|--------|
| TI Support SI constraint | Max 100% of Life Cover SI; absolute ceiling $300,000 |
| Major Trauma SI constraint | Max 300% of TRC SI when TRC < $25,000 |
| Early Trauma Benefit payout | Greater of $10,000 or 20% of TRC SI; ceiling $100,000 |
| Continuous Trauma Benefit | Max 3 full trauma claims per insured person |
| Trauma Reinstatement timing | 12-month wait after claim; requires Life Cover headroom or Life Cover buy-back |
| Specific Injury (Lump Sum) dependency | Must co-exist with at least one eligible Personal Insurance cover |
| We Pay Your Premiums trigger | Insured unable to work more than 10 hours/week after wait period |
| Ten-Hour Benefit (Workability) | Up to 10 hrs/week work without losing Living support benefit |
| Agreed Value vs Plus | Agreed Value offsets other income; Agreed Value Plus does not |
| Income Top-up Package boost | +33% monthly benefit for first 3 claim months; 25% income bonus for part-time return |
| Immediate Assist — Crisis Benefit | Paid on diagnosis of 11 specified conditions; ignores waiting period |

---

## 16. Automation Notes

### General

| Topic | Rule |
|-------|------|
| Cover button activation | Must use `eval button.click()` — standard Playwright `.click()` does not trigger OutSystems XHR |
| Sum Insured entry | Calc-mask is right-to-left. Clear with 10× Backspace (until display shows `.`), then type digits |
| Save mechanism | Tab out of any Sum Insured field → auto-save fires immediately — no modal needed |
| Dynamic element IDs | OutSystems regenerates IDs per session. Use `input[id*=SumInsured]` within cover section instead of hardcoded IDs |
| New Quote navigation | Patch `window.open` before clicking the New Quote `<a>` link so navigation stays in-page |
| Occupation search | React Select component — type search string then click the matching dropdown option |
| Age field population | Use `Ctrl+A` → `Delete` before `fill()` to avoid appending to existing value |
| Disability covers DOM section | Elements keyed under `b22-b12-l9-996_*` (Mortgage & Living = _0, Income Protection = _1, Workability = _2) |
| OutSystems label mislabels | Disability cover dropdowns have incorrect DOM `label` attributes; rely on field ID names (e.g. `Dropdown_WaitingPeriod3`) for semantic mapping |

### OutSystems-Specific (Apply Flow)

| Topic | Rule |
|-------|------|
| Text inputs (apply flow) | Standard `fill()` does NOT trigger OutSystems reactive binding. Use `page.keyboard.type()` via the `type` action in server.js — clicks the field, clears with Ctrl+A + Delete, then types with 40ms delay and Tab blur |
| Checkbox interaction | `label.click()` via eval does NOT register with OutSystems. Must: `el.scrollIntoView({block:"center"})` → get `getBoundingClientRect()` → `mouse-click` at viewport coordinates |
| Radio button interaction | Same as checkbox — scrollIntoView + mouse-click pattern required for all radio inputs |
| Button group (Yes/No) | `<button class="button-group-item">` elements. Selected state: class `button-group-selected-item`. Use scrollIntoView + mouse-click pattern |
| Off-screen elements | Elements with `y > viewport height` or `y < 0` must be scrolled into view before mouse-click: `el.scrollIntoView({block:"center"})` → re-query `getBoundingClientRect()` → mouse-click |
| Select dropdowns with complex IDs | `page.selectOption()` with long hyphenated IDs may 500. Use eval: `document.getElementById('...').value = '...'; document.getElementById('...').dispatchEvent(new Event('change'))` |
| Personal Statement completion | Pages 1–7 must all be answered before Underwriting Decision is reached. Unanswered questions are surfaced on a summary page at `UnderwritingSummary?l=1&ApplicationId=...`. Each Answer button links to the specific page and question |
| Payment — Credit Card | QuickStream cross-domain iframe. Cannot be automated. |
| Payment — Direct Debit | Requires a real valid NZ bank account (bank/branch/account combination validated by backend modulus check). Test with a known-good combination e.g. ASB `06-0141-XXXXXXX-00` |
| Policy Owner — Add required | Selecting from the owner dropdown does NOT add the owner. The Add button must be clicked explicitly |
| Adviser popups / modals | Adviser Use popups and separate block modals must have their OK or Apply button pressed before proceeding on the main screen. Check for `[role="dialog"]` modals after every navigation |
