# User Story: Lumpsum Needlestick Cover

| **Author/s** | @Ravi Bellamkonda |
| --- | --- |
| **Contributor/s** | @Amanda-Rose Harlen |
| **Reviewer/s** | @Lewis Daniels |
| **Approvers** | @Amanda-Rose Harlen |
| **Status** |  |
| **Jira** | [\[ACB-2931\] Build - Lump Sum Needlestick Cover : Online Quoting Tool - AsteronConnect - Jira](https://rlaanz.atlassian.net/browse/ACB-2931) |

| Story card | Apply for Personal Lump Sum Needlestick Cover |
| --- | --- |
| JIRA |   |
| User Story | As an Adviser/Adviser StaffI want to be able to apply for lump sum cover while I am creating a quote for a client So that I am able to add various lumpsum covers to the clients policy. |
| Pre-Conditions |  |
| PC01 | Adviser has been on-boarded (training completed, credentials provided to adviser) |
| PC02 |  |
| Acceptance Criteria |  |
|  AC01 | **Given** I am anAdviser or an Adviser staff **When** I am “creating a new quote” **Then** I should be provided the ability to apply for ‘lumpsum cover’ in the quote |
|  AC02 | **Given **I am in the Lump Sum Cover section**When **I am creating a new business quote/application**Then **I am able to see below lump sum covers - Life - TPD - Trauma - Cancer - Acd. Death - Needlestick - Specific Injury  **And **I must be able to select 1 or more covers |
|  AC03 | **Given** I am in the *Lump Sum Cover* section of the **New Business Quoting Tool**, **When** I select the **Needlestick** option, **Then** the following conditions must be met: 1. **Sum Insured Selection**     - A dropdown menu must be displayed, allowing selection of the **Sum Insured** amount.     - Available options should range from **$0 to $500,000**, in **$50,000 increments**. 2. **Premium Structure**     - The **Premium Structure** must be **defaulted to "Stepped"**.     - This field should be **greyed out** to indicate it is **non-editable**. |
| AC04 | **Given **I have selected **Needlestick****When **I have not selected any of the other covers “Life, Trauma Recovery, Cancer, TPD or Income Protection”**Then **an error message “Needlestick Cover requires one of the following covers to also be selected: Life, Trauma Recovery, Cancer, TPD or Income Protection” should be displayed |
| AC05 | **Given** I have selected the **Needlestick** option, **When** I choose an **occupation** that is **not eligible** for Needlestick cover, **Then** the system must: - Display an **error message** stating:    “Needlestick not available for the selected occupation” |
| AC06 | **Given **I have selected **Needlestick** option**When **age next birthday is less than 17**Then **an error message “The minimum age next birthday for Needlestick cover is 17” should be displayed |
| AC07 | **Given **I have selected **Needlestick** option**When **age next birthday is more than 65**Then **an error message “The maximum age next birthday for Needlestick cover is 65” should be displayed |
|  AC08 | **Given **I am in the quote screen**When **I have selected **Needlestick** option**Then **+Needlestick button should be greyed out **And **I should not be able to add one more needlestick cover for the same policy |
| AC09 | **Given **AC08 is active**When **I remove **Needlestick** cover**Then **+Needlestick button should be reenables so that I can add the cover |
| AC10 | **Given **I am in the quote screen **When** I have selected any of the covers “Life, Trauma Recovery, Cancer, TPD or IncomeProtection”And (no Occupation or occupation code for Life, Trauma Recovery, Cancer, TPDOR Occupation code is selected for Income Protection)Then Needlestick can be selected, and a premium is displayed |
| AC11 | **Given** I am in the *Needle* section of the *New Business Quoting Tool*, **When** I click the **"?" icon** next to any label, **Then** the system must: - Display the **corresponding tooltip** with relevant information for that label. **Label****Tooltip**NeedlestickFor certain occupations, provides additional financial protection against the risk of contracting hepatitis B or C or HIV. |
| **Label** | **Tooltip** |
| Needlestick | For certain occupations, provides additional financial protection against the risk of contracting hepatitis B or C or HIV. |
| Business Rules | - Needlestick Cover requires one of the following covers to also be selected: Life, Trauma Recovery, Cancer, TPD or Income Protection |
|  Exceptions/Limitations |   |
| Requirement Details / Technical Notes / Supporting Docs |   |
| Questions | - |


**Current State Screenshots:**
