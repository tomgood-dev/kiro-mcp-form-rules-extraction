# User Story: Business Policy Disability Cover \- Business/Farmers Disability

| **Author/s** | @Ravi Bellamkonda |
| --- | --- |
| **Contributor/s** | @Amanda-Rose Harlen |
| **Reviewer/s** | @Lewis Daniels |
| **Approvers** | @Amanda-Rose Harlen |
| **Status** |  |
| **Jira** | [\[ACB-2691\] Build - Business Policy: Business/Farmers disability cover - AsteronConnect - Jira](https://rlaanz.atlassian.net/browse/ACB-2691) |

| Story card | Apply for Business policy Disability Cover |
| --- | --- |
| JIRA |   |
| User Story | As an Advisor/Advisor StaffI want to be able to apply for Disability cover while I am creating a quote for a client So that I am able to add various Disability covers to the clients policy. |
| Pre-Conditions |  |
| PC01 | Advisor has been on-boarded (training completed, credentials provided to advisor) |
| PC02 |  |
| Acceptance Criteria |  |
|  AC01 | **Given** I am anAdviser or an Adviser staff **When** I am “creating a new quote for a business policy” **Then** I should be provided the ability to apply for ‘Disability cover’ in the quote |
|  AC02 | **Given **I am in the Disability Cover section**When **I am creating a new business quote/application**Then **I am able to see below Disability cover buttons - Business Disability - Farmers Disability - Business Expenses And I must be able to select 1 or more different coversNote: Current state has only one button for business/farmers disability |
|  AC03 | **Given** I am in the *Disability Cover* section of the *New Business Quoting Tool*, **When** I select **Business Disability** cover, **Then** the system must: 1. **Cover Type & Benefit:**     - Display **Business Disability** Label     - Allow entry of the **Monthly Benefit** amount. 2. **Classification:**     - Provide a **Classification** dropdown.         - Employed         - Equity Owner (up to 75%)         - Equity Owner (\>75%) 3. **Premium Structure:**     - Pre-populate the **Premium Structure** with **“Stepped”**. 4. **Waiting & Benefit Periods:**     - Allow selection of the **Benefit Period** from a dropdown with the following options:         - 6 Months (default selected)         - 9 Months         - 12 Months         - 18 Months         - 24 Months     - Allow selection of the **Waiting Period** from a dropdown with the following options:         - 30 Days (default selected)         - 60 Days         - 90 Days 5. **Optional Benefits:**     - Allow selection of the following options via checkboxes:         - **Business Security**         - **Partial Disablement** (default selected) |
| AC04 | **Given** I am in the *Disability Cover* section of the *New Business Quoting Tool*, **When** I select **Farmers Disability** cover, **Then** the system must: 1. **Cover Type & Benefit:**     - Display **Farmers Disability** Label     - Allow entry of the **Monthly Benefit** amount. 2. **Premium Structure:**     - Pre-populate the **Premium Structure** with **“Stepped”**. 3. **Waiting & Benefit Periods:**     - Allow selection of the **Benefit Period** from a dropdown with the following options:         - 6 Months (default selected)         - 9 Months         - 12 Months         - 18 Months         - 24 Months         - 5 Years     - Allow selection of the **Waiting Period** from a dropdown with the following options:         - 30 Days (default selected)         - 60 Days         - 90 Days 4. **Optional Benefits:**     - Allow selection of the following options via checkboxes:         - **Business Security**         - **Partial Disablement** (default selected) |
|  AC05 | **Given** AC04 is active, **When** I have selected **Farmers Disability** cover, **Then** the system must not display and allow to select Classification |
|  AC06 | **Given** AC04 is active, **When** I have selected **Farmers Disability** cover **And** the **selected occupation **is not suitable, **Then** the system must: - Display the following **error message**: **“Farmers Disability Cover is not available for the selected occupation.”** |
|  AC07 | **Given** AC04 is active, **When** I have selected **Farmers Disability** cover **And** the **selected occupation is not eligible** **And** the **Employment Status** is **“Employed”**, **Then** the system must: - Display the following **error messages**:     1. **“Farmers Disability Cover is not available for the selected occupation.”**     2. **“Eligibility for Farmers Disability Cover requires an Employment Status of either 'Self Employed' or 'Employed by own company'.”** |
|  AC08 | **Given** AC04 is active, **When** I have selected **Farmers Disability** cover **And** the **occupation **is not eligible, **Then** the system must: - Display the following **error messages**: **“This occupation is not eligible.”** - **“Farmers Disability Cover is not available for the selected occupation”** |
|  AC09 | **Given** AC04 is active , **When** I select or click on **Business Disability**, **Then** the system must: - **Disable** the ability to add another **Business Disability** cover. - Ensure the **"+ Business Disability"** button is **grayed out** and **non-clickable**. |
|  AC10 | **Given** AC03 is active , **When** I select or click on **Farmers Disability**, **Then** the system must: - **Disable** the ability to add another **Farmers Disability** cover. - Ensure the **"+ Farmers Disability"** button is **grayed out** and **non-clickable**. |
| AC11 | **When **I have selected the cover type**Then **I must be provided the option to ‘add’ or ‘remove’ the cover type**And **I must be able to view the changes to the premiums on the “Progress Panel for application progress” |
| AC12 | **Given** I am in the *Disability Cover* section of the *New Business Quoting Tool*, **When** I click the **"?" icon** next to any label, **Then** the system must: - Display the **corresponding tooltip** with relevant information for that label. **Label****Tooltip**Business SecurityAllows future increases without medical underwriting. Financial justification for increases required. |
| **Label** | **Tooltip** |
| Business Security | Allows future increases without medical underwriting. Financial justification for increases required. |
| AC13 | **Given **I have selected **Business Disability  ****When **age next birthday is more than 61**Then **an error message “The maximum Age Next Birthday for Business Disabilityis 61” should be displayed |
| AC14 | **Given **I have selected **Farmers Disability****When **age next birthday is more than 61**Then **an error message “The maximum Age Next Birthday for Farmers Disabilityis 61” should be displayed |
| AC15 | **Given **I have selected **Business Disability****When **monthly benefit amount is more than 50000**Then **an error message “The maximum allowable monthly benefit for Business Disability Cover is $50,000” should be displayed |
| AC16 | **Given **I have selected **Farmers Disability****When **monthly benefit amount is more than 10000**Then **an error message “The maximum allowable Farmers Disability monthly benefit for the selected occupation is $10,000” should be displayed |
| AC17 | **Given **I have selected **Farmers Disability****When **I have also selected personal policy workability cover**Then **an error message “Farmers Disability Cover is not available to be taken in conjunction with Workability Cover” should be displayed |
| AC18 | **Given **I have selected **Business Disability****When **I have also selected personal policy workability cover**Then **an error message “Business Disability Cover is not available to be taken in conjunction with Workability Cover” should be displayed |
| AC19 | **Given **I have selected **Business Disability****When **I have also selected farmers disability cover**Then **an error message “Business Disability Cover and Farmers Disability Cover are not available to be taken in conjunction with each other” should be displayed |
| AC20 | **Given **I have selected **Farmers Disability****When **I have also selected business disability cover**Then **an error message “Business Disability Cover and Farmers Disability Cover are not available to be taken in conjunction with each other” should be displayed |
| AC21 | **Given **I have selected occupation “Sharemilker - Not an employee milker”**When **I have also selected **Farmers Disability** cover**Then **an error message “The maximum allowable Farmers Disability monthly benefit for the selected occupation is $5,000” should be displayed |
| AC22 | **Given **I have selected **Business Disability**/**Farmers Disability**,**When **age next birthday more than 56**And **I select Business Security Option**Then **an error message “The maximum Age Next Birthday for Business Security is 56” should be displayed |
| AC23 | **Given **I have selected **Business Disability****When **age next birthday less than 17**Then **an error message “The minimum Age Next Birthday for Business Disability is 17” should be displayed |
| AC24 | **Given **I have selected **Farmers Disability****When **age next birthday less than 17**Then **an error message “The minimum Age Next Birthday for Farmers Disability is 17” should be displayed |
| AC25 | **Given **I have selected **Business Disability****When **classification is “Equity Owner (\>75%)**And** I select Benefit Period 18 months or 24 months **Then **an error message “The available benefit periods for Business Disability Cover with the selected classification are 6, 9 or 12 months” should be displayed |
| Business Rules | The allowable Farmers occupations are: Farming / Farmer - Owner / Manager: \< 5 years' experience, or \>= 10% manual workSharemilker - Not an employee milkerFarming / Farmer - Owner / Manager: \> 5 years' experience, \<10% manual work and large operation i.e. multiple employees performing manual work.Dairy Farm Manager/Owner: \<5 years experience, or \>= 10% manual workDairy Farm Manager/Owner: \> 5 years' experience, \<10% manual work and large operation i.e. multiple employees performing manual work. |
|  Exceptions/Limitations |   |
| Requirement Details / Technical Notes / Supporting Docs |   |
| Questions | - |


**Current State Screenshots:**
