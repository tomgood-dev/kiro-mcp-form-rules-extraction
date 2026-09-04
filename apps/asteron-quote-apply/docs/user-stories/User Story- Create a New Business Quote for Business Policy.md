# User Story: Create a New Business Quote for Business Policy

| **Author/s** | @Ravi Bellamkonda |
| --- | --- |
| **Contributor/s** | @Amanda-Rose Harlen |
| **Reviewer/s** | @Lewis Daniels |
| **Approvers** | @Amanda-Rose Harlen |
| **Status** |  |
| **Jira** | [\[ACB-3343\] Build - Business: Create new quote for a business policy - Jira](https://rlaanz.atlassian.net/browse/ACB-3343) |

|  | Apply for Business policy |
| --- | --- |
| JIRA |   |
| User Story | As anAsteron Adviser/Adviser staffI want to be able to generate a new business quote for a personal or business insurance coverSo that Customer are provided a new business quote. |
| Pre-Conditions |  |
| PC01 | Adviser has been onboarded and advisor has their credentials to log into the portal and generate a new business quote. |
| PC02 | Adviser has been on-boarded (training completed, credentials provided to advisor) |
| Acceptance Criteria |  |
| AC01 | **Given** I am an Adviser/Adviser staff**When** I am in the landing page**Then **I should be able to select my agency (one adviser can be associated with multiple agencies)**And ** click create quote |
|  AC02 | **Given** I am an Adviser/Adviser staff**When** I am in the New Business Quote Tool UI**Then **I should be able to select if the new quote/application is for a Personal Policy and/or Business Policy |
| AC03 | **Given** I am an Adviser/Adviser staff**When** I click on “new quote”**Then **I should be presented with a UI screen where i can capture the following information: - Personal Details of the client     - First Name     - Surname     - Date of birth (dd/mm/yyyy)     - Age next birthday (Mandatory)     - Gender (Mandatory)     - Smoker (Mandatory)     - Occupation (Mandatory- drop down list) when they proceed with application     - Occupation code (drop down list mandatory to get a quote - This should be auto populated upon selecting occupation or user should be able to select code without Occupation in the quote stage)     - Employment status (Mandatory -drop down list)     - Annual Income     - Inflation adjustment benefit  (Default auto-ticket)     - Premium freeze     - We pay your premiums (drop down list)     - Flexi Rate (drop down list) - Lumpsum Cover(Personal)     - Life         - TI Support         - Acc. TPD         - Acc. Trauma         - Acc. Cancer     - TPD     - Trauma         - Early Trauma         - Trauma Reinstatement OR Continuous trauma         - Major Trauma         - TPD on Trauma     - Cancer     - Accidental Death     - Needlestick     - Specific Injury - Disability Cover     - Mortgage & Living     - Income Protection     - Workability |
|  AC04 | **Given** I am an Adviser/Adviser staff**When** I click on “+ Business Policy”**Then **I should be presented with a UI in the new tab with following information - Inflation Adjustment(Checkbox) - Default checked - Premium Freeze(Checkbox) - This should be removed in the target state.  - We pay your premiums (drop down list) - Flexi Rate (drop down list) - Lumpsum Cover     - Life         - Acc. TPD         - Acc. Trauma     - TPD     - Trauma         - Major Trauma         - TPD on Trauma     - Specific Injury - Disability Cover     - Business/Farmers Disability      - Business Expenses |
| AC05 | **When **I select Flexi Rate**Then **a prepopulated list of rates (N/A(default) & 2.5% up to 30.00%) must be displayed**And **I must be able to select and save the Flexi Rate. |
| AC06 | **When **I select We Pay Your Premiums**Then **a prepopulated list of waiting periods (None(default), 30, 60, 90 days) must be displayed**And **I have not selected any lump sum cover**Then **a warning message “At least one lump sum cover must be selected with We Pay Your Premiums”. |
|  AC07 | **Given** I am in the Business quote section of the *New Business Quoting Tool*, **When** I click the **"?" icon** next to any label, **Then** the system must: - Display the **corresponding tooltip** with relevant information for that label. **Label****Tooltip**We Pay Your PremiumsWaives the premiums for all the lump sum cover premiums on the policy after the chosen wait period if the insured is sick or disabled and cannot work for more than 10 hours a week after the chosen waiting period. Flexi-RateFlexi-rate allows you to discount your clients premium by reducing all or part of the Advisers Initial and/or Renewal Commission. |
| **Label** | **Tooltip** |
| We Pay Your Premiums | Waives the premiums for all the lump sum cover premiums on the policy after the chosen wait period if the insured is sick or disabled and cannot work for more than 10 hours a week after the chosen waiting period.  |
| Flexi-Rate | Flexi-rate allows you to discount your clients premium by reducing all or part of the Advisers Initial and/or Renewal Commission. |
| Business Rules |  |
|  Exceptions/Limitations |   |
| Requirement Details / Technical Notes / Supporting Docs |   |
| Questions | - |

**Current State Screenshots:**
