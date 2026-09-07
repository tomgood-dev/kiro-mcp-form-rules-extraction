# User Story: Business Policy Disability Cover \- Business Expenses

| **Author/s** | @Ravi Bellamkonda |
| --- | --- |
| **Contributor/s** | @Amanda-Rose Harlen |
| **Reviewer/s** | @Lewis Daniels |
| **Approvers** | @Amanda-Rose Harlen |
| **Status** |  |
| **Jira** | [\[ACB-2695\] Build - Business Policy: Business Expenses cover - AsteronConnect - Jira](https://rlaanz.atlassian.net/browse/ACB-2695) |

| Story card | Apply for Disability Cover - Business Expenses |
| --- | --- |
| JIRA |   |
| User Story | As an Advisor/Advisor StaffI want to be able to apply for Disability cover while I am creating a quote for a client So that I am able to add various Disability covers to the clients policy. |
| Pre-Conditions |  |
| PC01 | Advisor has been on-boarded (training completed, credentials provided to advisor) |
| PC02 |  |
| Acceptance Criteria |  |
|  AC01 | **Given** I am anAdviser or an Adviser staff **When** I am “creating a new quote for a business policy” **Then** I should be provided the ability to apply for ‘Disability cover’ in the quote |
|  AC02 | **Given **I am in the Disability Cover section**When **I am creating a new business quote/application**Then **I am able to see below Disability covers - Business/Farmers Disability - Business Expenses And I must be able to select 1 or more different covers, and I can only have Business Disability & Business Expenses OR Farmers Disability & Business Expenses, and each can only be selected once. |
|  AC03 | **Given** I am in the *Disability Cover* section of the *New Business Quoting Tool*, **When** I select **Business Expenses** cover, **Then** the system must: 1. **Monthly Benefit:**     - Allow entry of the **Monthly Benefit** amount. 2. **Premium Structure:**     - Provide a dropdown to view the **Premium Structure** with the following options:         - **Stepped** (default)         - Display as **greyed out** (non-editable). 3. **Waiting & Benefit Periods:**     - **Benefit Period**:         - Pre-populate with **“1 year”**.         - Display as **greyed out** (non-editable).     - **Waiting Period**:         - Provide a dropdown with the following options:             - **14 Days **(default selected)             - **30 Days**              - **60 Days**             - **90 Days** |
| AC04 | **Given** AC03 is active, **When** I have selected **Business Expenses** cover **And** the **selected occupation **is not suitable, **Then** the system must: - Display the following **error message**: **“Business Expenses Cover is not available for the selected occupation.”** |
| AC05 | **Given** AC03 is active, **When** I have selected **Business Expenses** cover **And** the **monthly benefit amount **is more than 16666, **Then** the system must: - Display the following **error message**: **“**The maximum allowable Business Expenses monthly benefit for the selected occupation is $16,666**.”** Note: Maximum cover per anum is 200000 which means 16,666 monthly. |
| AC06 | **Given** AC03 is active , **When** I select or click on **Business Expenses**, **Then** the system must: - **Disable** the ability to add another **Business Expenses**cover. - Ensure the **"+ Business Expenses"** button is **grayed out** and **non-clickable**. |
|  AC07 | **When **I have selected the cover type**Then **I must be provided the option to ‘add’ or ‘remove’ the cover type or update the details**And **I must be able to view the changes to the premiums on the “Progress Panel for application progress” |
| AC08 | **Given **I have selected **Business Expenses****When **age next birthday is more than 61Then an error message “The maximum Age Next Birthday for Business Expensesis 61” should be displayed |
| AC09 | **Given **I have selected **Business Expenses****When **age next birthday is less than 17Then an error message “The minimum Age Next Birthday for Business Expensesis 17” should be displayed |
| AC10 | **Given **I have selected Personal policy workability cover**When **I have also selected  **Business Expenses****Then **an error message “Business Expenses Cover is not available to be taken in conjunction with Workability Cover” should be displayed |
| Business Rules |  |
|  Exceptions/Limitations |   |
| Requirement Details / Technical Notes / Supporting Docs |   |
| Questions | - |


**Current State Screenshots:**
