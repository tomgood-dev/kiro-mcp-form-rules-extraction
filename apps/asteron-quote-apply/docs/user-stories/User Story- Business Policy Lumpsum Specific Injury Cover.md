# User Story: Business Policy Lumpsum Specific Injury Cover

| **Author/s** | @Ravi Bellamkonda |
| --- | --- |
| **Contributor/s** | @Amanda-Rose Harlen |
| **Reviewer/s** | @Lewis Daniels |
| **Approvers** | @Amanda-Rose Harlen |
| **Status** |  |
| **Jira** | [\[ACB-2941\] Build - Business: Lump Sum Specific Injury Cover : Online Quoting Tool - AsteronConnect - Jira](https://rlaanz.atlassian.net/browse/ACB-2941) |

| Story card | Apply for Business Lump Sum Specific Injury Cover |
| --- | --- |
| JIRA |   |
| User Story | As an Advisor/Advisor StaffI want to be able to apply for lump sum cover for a business policySo that I am able to add various lumpsum covers to the clients policy. |
| Pre-Conditions |  |
| PC01 | Advisor has been on-boarded (training completed, credentials provided to advisor) |
| PC02 |  |
| Acceptance Criteria |  |
|  AC01 | **Given** I am anAdviser or an Adviser staff **When** I am “creating a new quote” **Then** I should be provided the ability to apply for Business ‘lumpsum cover’ in the quote |
|  AC02 | **Given **I am in the Lump Sum Cover section**When **I am creating a new business quote/application**Then **I am able to see below lump sum covers - Life - TPD - Trauma - Specific Injury  **And **I must be able to select 1 or more covers |
|  AC03 | **Given** I am in the *Lump Sum Cover* section of the **New Business Quoting Tool**, **When** I select the **Specific Injury **option, **Then** the following conditions must be met: 1. **Sum Insured**     - I must be provided the ability to enter the Sum Insured amount 2. **Premium Structure**     - The **Premium Structure** must be **defaulted to "Stepped"**.     - This field should be **greyed out** to indicate it is **non-editable**. |
| AC04 | **Given **I have selected **Specific Injury****When **I have not selected any other covers Life, Trauma Recovery, Cancer, TPD, Business Disability, Farmers Disability or Business Expenses**Then **an error message “Specific Injury Lump Sum requires one of the following covers to also be selected: Life, Trauma Recovery, Cancer, TPD, Business Disability, Farmers Disability or Business Expenses” should be displayed |
| AC05 | **Given **I have selected **Specific Injury**,**When  combined **Sum Insured(both personal and business policy specific injury cover SI) is more than 5,000**Then **an error message “The maximum total Sum Insured per life for Specific Injury Lump Sum is $5,000” should be displayed |
| AC06 | **Given **I have selected **Specific Injury **option**When **age next birthday is less than 17**Then **an error message “The minimum Age Next Birthday for Specific Injury cover is 17” should be displayed |
| AC07 | **Given **I have selected **Specific Injury **option**When **age next birthday is more than 61**Then **an error message “The maximum Age Next Birthday for Specific Injury cover is 61” should be displayed |
|  AC08 | **When **I have selected the cover type**Then **I must be provided the option to ‘add’ or ‘remove’ the cover type or modify details**And **I must be able to view the changes to the premiums on the “Progress Panel for application progress” |
| AC09 | **Given** I have selected the **Specific Injury** option**When** I attempt to add **another Specific Injury****Then**: - I **should not** be able to add an additional Specific Injury - The **+Specific Injury** button must be **greyed out** and **disabled** |
| AC10 | **Given **I have selected **Specific Injury**,**When **Sum Insured is less than 500**Then **an error message “The minimum Specific Injury Lump Sum sum insured is $500” should be displayed |
| AC11 | **Given **I have selected **Specific Injury**,**When **the validation runs**Then** life insured is eligible for Specific Injury cover if they meet **any one** of the following: - ≥ $100,000 Life/TPD, **OR** - ≥ $25,000 Trauma Recovery, **OR** - ≥ $1,000 Monthly any disability cover **And** if none of the categories meet the minimum thresholds**Then **an error message “Specific Injury Lump Sum requires a minimum cover amount per Life insured of at least: $100,000 of Life or TPD Cover, $25,000 of Trauma Recovery, $1,000 of any monthly disability cover” should be displayed |
| AC12 | **Given** I am in the *Specific Injury* section of the *New Business Quoting Tool*, **When** I click the **"?" icon** next to any label, **Then** the system must: - Display the **corresponding tooltip** with relevant information for that label. **Label****Tooltip**Specific Injury SupportThe Specific injury support benefit – Lump sum pays a multiple of the sum insured for specified injuries suffered as a result of an accident. It must be purchased with at least one eligible Business Insurance cover. |
| **Label** | **Tooltip** |
| Specific Injury Support | The Specific injury support benefit – Lump sum pays a multiple of the sum insured for specified injuries suffered as a result of an accident. It must be purchased with at least one eligible Business Insurance cover. |
| AC13 | **Given **I have selected **Specific Injury for personal or business policy**,**When **I select MLC cover for the same life insured on any personal policy**Then** Specific Injury Support Benefit option under MLC cover should be greyed out and cannot be selected |
| Business Rules | 1. The maximum Sum Insured per life for specific injury lumpsum cover is $5,000 and Minimum is $500 per policy 2. Specific Injury Lump Sum requires one of the following covers to also be selected: Life, Trauma Recovery, Cancer, TPD, Business Disability, Farmers Disability or Business Expenses |
|  Exceptions/Limitations |   |
| Requirement Details / Technical Notes / Supporting Docs |   |
| Questions | - |

**Current State Screenshots:**
