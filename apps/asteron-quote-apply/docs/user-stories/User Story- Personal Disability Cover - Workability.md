# User Story: Personal Disability Cover \- Workability

| **Author/s** | @Ravi Bellamkonda |
| --- | --- |
| **Contributor/s** | @Amanda-Rose Harlen |
| **Reviewer/s** | @Lewis Daniels |
| **Approvers** | @Amanda-Rose Harlen |
| **Status** |  |
| **Jira** | [\[ACB-2648\] Build - Personal Policy: Workability Cover - AsteronConnect - Jira](https://rlaanz.atlassian.net/browse/ACB-2648) |

| Story card | Apply for Personal Disability Cover - Workability |
| --- | --- |
| JIRA |   |
| User Story | As an Advisor/Advisor StaffI want to be able to apply for workability cover while I am creating a quote for a client So that I am able to add various Disability covers to the clients policy. |
| Pre-Conditions |  |
| PC01 | Advisor has been on-boarded (training completed, credentials provided to advisor) |
| PC02 |  |
| Acceptance Criteria |  |
|  AC01 | **Given** I am anAdviser or an Adviser staff **When** I am “creating a new quote for a personal policy” **Then** I should be provided the ability to apply for ‘Disability cover’ in the quote |
|  AC02 | **Given **I am in the Disability Cover section**When **I am creating a new business quote/application**Then **I am able to see below Disability covers - Mortgage & Living - Income Protection - Workability And I must be able to select 1 or more different covers |
|  AC03 | Given I am in the Disability cover section of the New Business Quoting toolWhen I select Workability coverThen system must**Monthly Benefit:** - Automatically populate the **Monthly Benefit** amount using the business rule. - Allow me to **update** the Monthly Benefit amount manually if needed. 1. Provide a dropdown to select **Premium Structure **and should be able to select any of      - Stepped(default)     - Level to Expiry 2. **Waiting & Benefit Periods:**     - Allow selection of the **Benefit Period** from a dropdown.         - To Age 65(default)         - To Age 70     - Allow selection of the **Waiting Period** from a dropdown.         - 30 Days(default)         - 45 Days         - 60 Days         - 75 Days         - 90 Days 3. **Optional Benefits:**     - Allow selection of the following option via checkbox:         - **Increasing Claim (default ticked)** |
|  AC04 | **When **I have selected the cover type**Then **I must be provided the option to ‘add’ or ‘remove’ the cover type or update details**And **I must be able to view the changes to the premiums on the “Progress Panel for application progress” |
| AC05 | **Given** AC02 , **When** I select or click on **Workability**, **Then** the system must: - **Disable** the ability to add another **Workability** cover. - Ensure the **"+ Workability"** button is **grayed out** and **non-clickable** |
| AC06 | **Given** AC03 is active, **When** I update the **Monthly Benefit** to an amount that exceeds the **calculated Monthly Benefit**, **Then** the system must: - Display the following **error message**: **“The maximum allowable monthly benefit for Workability based on annual income $XXXX is $YYYY.”**  **Note:** > - **XXXX** = *Annual income entered in the quote screen* > - **YYYY** = *Minimum of*: **$10,000**, or **(75% of Annual Income) ÷ 12** |
| AC07 | **Given **I have selected **Workability****When **age next birthday is more than 61Then an error message “The maximum Age Next Birthday for Workability is 61” should be displayed |
| AC08 | **Given **I have selected **Workability****When **I have also selected Income protection or Mortgage & Living cover**Then **an error message “Workability Cover is not available to be taken in conjunction with Mortgage & Living Cover or Income Protection Cover “ Should be displayed |
| AC09 | **Given **I have selected Business insurance disability cover**When **I have also selected **Workability****Then **an error message “Workability Cover is not available to be taken in conjunction with Business Disability Cover” should be displayedNote: The benefit that is added last, appear first in the error message. e.g. Select Workability, then Business Disability and message will show: Business Disability Cover is not available to be taken in conjunction with Workability Cover Select Business Disability then Workability and message shows: Workability is not available to be taken in conjunction with Business Disability Cover |
| AC09A | **Given **I have selected Business insurance Farmers cover**When **I have also selected **Workability** **Then **an error message “Workability Cover is not available to be taken in conjunction with Farmers Disability Cover” should be displayedNote: The benefit that is added last, appear first in the error message. e.g. Select Workability, then Farmers Disability and message will show: Farmers Disability Cover is not available to be taken in conjunction with Workability Cover Select Farmers Disability then Workability and message shows: Workability is not available to be taken in conjunction with  Farmers Disability Cover |
| AC10 | **Given **I have selected Business policy business expenses disability cover**When **I have also selected **Workability****Then **an error message “Workability Cover is not available to be taken in conjunction with Business Expenses Cover” should be displayedNote: The benefit that is added last, appear first in the error message. e.g. Select Workability, Business Expenses Cover and message will show: Business Expenses Cover is not available to be taken in conjunction with Workability Cover |
| AC11 | **Given** AC03 is active, **When** I have selected **Workability** cover **And** I enter a sum of **Monthly Benefit** amounts across policies per life exceeds either: - **$10,000**, or - **75% of pre-tax annual income divided by 12**, **Then** the system must: - Display the following **error message**: **“The maximum allowable monthly benefit for Workability based on an annual income of $XXXX is $YYYY.”**  **Where:** > - **XXXX** = *Annual Income* > - **YYYY** = *Minimum of*: >     - **$10,000**, or >     - **(75% of Annual Income) ÷ 12** |
| AC12 | **Given **I have selected **Workability****When **I unselect inflation adjustment**Then **an error message “If Increasing Claim is selected, then Inflation Adjustment Benefit must also be taken for this policy” should be displayed. |
| AC13 | **Given **I have selected **Workability****When **age next birthday is less than 17Then an error message “The minimum Age Next Birthday for Workability is 17” should be displayed |
| Business Rules | *Calculated monthly benefit for workability cover per life is minimum of*: **$10,000**, or **(75% of Annual Income) ÷ 12** |
|  Exceptions/Limitations |   |
| Requirement Details / Technical Notes / Supporting Docs |   |
| Questions | - |


**Current State Screenshots:**
