# User Story: Discounts & Bundling Discounts



| **Author/s** | @Ravi Bellamkonda |
| --- | --- |
| **Contributor/s** | @Amanda-Rose Harlen |
| **Reviewer/s** | @Lewis Daniels |
| **Approvers** | @Amanda-Rose Harlen |
| **Status** |  |
| **Jira** | [\[ACB-2296\] Build - Bundling Discounts: Online Quoting Tool - AsteronConnect - Jira](https://rlaanz.atlassian.net/browse/ACB-2296) |

| Story card | Discounts & Bundling Discounts |  |
| --- | --- | --- |
| JIRA |   |  |
| User Story | As an Advisor/Advisor StaffI want to be able to log into a life insurance quoting toolSo that I am able to create a new life insurance quote for my clients. |  |
| Pre-Conditions |  |  |
| PC01 | Advisor has been on-boarded (training completed, credentials provided to advisor) |  |
| PC02 | Adviser is currently creating a new quote/application |  |
| **Dependencies User Stories ** |  |  |
|  | [User Story: Create a New Business Quote](https://acendalife.atlassian.net/wiki/spaces/CFDDP/pages/1058472042/User+Story+Create+a+New+Business+Quote) |  |
|  | Pricing Engine (works out the discounts and bundling discounts based on cover and additional life added. |  |
| Acceptance Criteria |  |  |
|  AC01 | **Given** I am anAdviser or an Adviser staff **When** I am creating a new quote/application **Then** I should be able to view all discounts (Marked as "Bundling Discounts") that are being applied to the quote if there are multiple covers. |  |
| AC02 | **Given** I am anAdviser or an Adviser staff **When** I am creating a new quote/application **Then** I should be able to view 15% discounts that are being applied to the quote if there are 2 eligible covers as per business rules. |  |
|  AC03 | **Given** I am anAdviser or an Adviser staff **When** I am creating a new quote/application **Then** I should be able to view 20% discounts that are being applied to the quote if there are 3 or more eligible covers as per business rules. |  |
|  AC04 | **Given** I am anAdviser or an Adviser staff **When** I remove the last of an eligible cover type**Then** the system should: - Recalculate and display the **updated discount** based on the remaining eligible covers. - **Remove any discounts** if the remaining covers no longer meet the eligibility criteria or reduce the SI below the minimum for bundling.   E.g. PER- Life,  BUS-Life, TPD.   Removing a single Life Cover would still remain eligible if SI minimum is present for the remaining  Life Cover |  |
|  AC05 | **Given** I am an **Adviser** or **Adviser Staff****When** there are **multiple eligible coverages** (i.e., 2 or more across policies and across PER/BUS) selected in the quote**Then** I should be able to see the **discount** displayed in the **details banner** on the **right-hand side** of the UI |  |
| AC06 | **Given **AC05 is in place**When** I click on the  next to Bundling Discounts in the details banner on the right side**Then** below **tooltip** message should be displayed, explaining **how the discount is calculated**A discount that applies to Personal & Business for taking out multiple cover types: - 2 cover types: 15% - 3 or more cover types: 20% |  |
| Business Rules | for each cover added discounts are' bundled'. For bundling discount only count each type of cover once towards the Bundling discount. The eligible types of cover are:**Cover Type****Eligible Cover****Minimum Sum Insured / Monthly Benefit**Life Life Cover $100,000Trauma  Trauma Recovery CoverCancer Cover$25,000TPD TPD Cover$100,000Disability Income Protection Cover Workability Cover Mortgage and Living CoverBusiness Disability CoverFarmers Disability CoverBusiness Expenses Cover$1,000 per monthWe’ll apply the bundling discounts to both Business and Personal Insurance policies that commence on or after 8th August 2016. The discount will be applied to all premiums on the policy other than Kids Cover premiums.2 of the same cover are not eligible (whether same policy, multiple policies or a mix of PER&BUS)Business and Farmers Disability, and Business Expenses are also eligible |  |
| **Cover Type** | **Eligible Cover** | **Minimum Sum Insured / Monthly Benefit** |
| Life | Life Cover | $100,000 |
| Trauma | Trauma Recovery CoverCancer Cover | $25,000 |
| TPD | TPD Cover | $100,000 |
| Disability | Income Protection Cover Workability Cover Mortgage and Living CoverBusiness Disability CoverFarmers Disability CoverBusiness Expenses Cover | $1,000 per month |
|  Exceptions/Limitations | Sum insured banding discounts are not displayed in the screen and these are applied in the pricing engine and premium amounts after discount will be sent to quote screen. Acceptance criteria is not captured in this page for all pricing engine discounts. |  |
| Requirement Details / Technical Notes / Supporting Docs |   |  |
| Questions: |  |  |


**Screenshots from Current State:**
