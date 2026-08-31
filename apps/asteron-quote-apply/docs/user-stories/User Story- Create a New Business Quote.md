# User Story: Create a New Business Quote



| **Author/s** | @Ravi Bellamkonda |
| --- | --- |
| **Contributor/s** | @Amanda-Rose Harlen |
| **Reviewer/s** | @Lewis Daniels |
| **Approvers** | @Amanda-Rose Harlen |
| **Status** |  |
| **Jira** | [\[ACB-2240\] Build - Create a New Business Quote: Online Quoting Tool - AsteronConnect - Jira](https://rlaanz.atlassian.net/browse/ACB-2240) |

| Story card | Create New Quote |
| --- | --- |
| JIRA |   |
| User Story | As anAsteron Adviser/Adviser staffI want to be able to generate a new business quote for a personal or business insurance coverSo that Customer are provided a new business quote. |
| Pre-Conditions |  |
| PC01 | Advisor has been onboarded and advisor has their credentials to log into the portal and generate a new business quote. |
| PC02 | Advisor has successfully logged into adviser portal and navigated to the New Business Quoting Tool [User Story: Generate Quote PDF (view only)](https://acendalife.atlassian.net/wiki/spaces/CFDDP/pages/1151107073/User+Story+Generate+Quote+PDF+view+only) |
| **Dependencies User Stories ** | Progress Panel for application progress |
| Acceptance Criteria |  |
|  AC01 | **Given** I am an Adviser/Adviser staff**When** I am in the landing page**Then **I should be able to select my agency (one adviser can be associated with multiple agencies)**And ** click create quote |
|  AC02 | **Given** I am an Adviser/Adviser staff**When** I am in the New Business Quote Tool UI **Then **I should be able to select if the new quote/application is for a Personal Policy and/or Business Policy |
| AC04 | **Given** I am an Adviser/Adviser staff**When** I click on “new quote”**Then **I should be presented with a UI screen where i can capture the following information: - Personal Details of the client     - First Name      - Surname      - Date of birth (dd/mm/yyyy)     - Age next birthday (Mandatory)     - Gender (Mandatory)     - Smoker (Mandatory)      - Occupation (Mandatory- drop down list) when they proceed with application     - Occupation code (drop down list mandatory to get a quote - This should be auto populated upon selecting occupation or user should be able to select code without Occupation in the quote stage)      - Employment status (Mandatory -drop down list)      - Annual Income     - Inflation adjustment benefit  (Default auto-ticket)     - Premium freeze       - We pay your premiums (drop down list)     - Flexi Rate (drop down list)  - Lumpsum Cover(Personal)     - Life          - TI Support         - Acc. TPD          - Acc. Trauma          - Acc. Cancer      - TPD     - Trauma         - Early Trauma         - Trauma Reinstatement OR Continuous trauma         - Major Trauma         - TPD on Trauma     - Cancer      - Accidental Death     - Needlestick     - Specific Injury - Disability Cover      - Mortgage & Living      - Income Protection     - Workability - Kids Cover |
| AC05 | **When **I enter the birthday date **Then **the ‘age next birthday’ must be calculated**And **the age next birthday must be displayed on the screen |
| AC06 | **When **I select ‘occupation’**Then **a pre-populated list of occupation must be displayed**And **I must be able to search and select the occupation type**When** I have selected the ‘occupation’ **Then **the occupation code must be prepopulated based on the occupation selected. |
| AC07 | **When **I choose to select occupation code instead of occupation**Then **a pre-populated list of occupation code must be displayed**And **I must be able to select the occupation code**Then **the occupation code must prepopulate the occupation field on screen |
| AC08 | **When **I enter the employment status **Then **the following list of employment status must be displayed  - Employed - Self Employed - Employed by own company - Other **And **I must be able to select the employment status |
| AC09 | The following fields on screen must be mandatory  - Age next birthday  - Gender  - Smoker - Occupation or Occupation Code - Employment Status |
| AC10 | **When **I select Flexi Rate **Then **a prepopulated list of rates (2.5% up to 30.00% and default is N/A) must be displayed**And **I must be able to select and save the Flexi Rate. |
| AC11 | **When **I select We Pay Your Premiums **Then **a prepopulated list of waiting periods (None(default), 30, 60, 90 days) must be displayed**And **I must be able to select **And **a warning message “At least one lump sum cover must be selected with We Pay Your Premiums”  should be displayed. |
| AC12 | **When **I select the Cover type **Then **I must be provided the ability to enter the Sum Insured amount**And **based on the cover type selected the premium structure must have a pre-populated list with default Stepped |
| AC13 | **When **I have selected the cover type **Then **I must be provided the option to ‘add’ or ‘remove’ the cover type **And **I must be able to view the changes to the premiums on the “Progress Panel for application progress” |
| AC14 | **When **I have choose number of kids (0 to 9) in the kids cover**Then **I must be provided ability to enter kid’s first name, surname, date of birth, gender per kid    **And **I must be able to view prepopulated with 50K and list of sum insureds up to 200k (default 50k) must be displayed for each kid |
| AC15 | **When **I have added one or more policies to the new business quote/application **Then **I must have the ability to select the premium frequency for each policy from the following options as a drop down list: - Fortnightly  - Monthly (default) - Quarterly  - Half Yearly  - Yearly **And **this selection must be update on the quote/application |
|  |  |
| Business Rules | 1. Flexi Rate - Discount applied to premiums and also decreases the advisers ommission to pass on the premium discount to the customer.  2. Flexi Rate - range can be N/A  3. Flexi Rate is selected ranges from 2.50% - 30.00%  4. Can create ‘add life’ to the quote/application 5. Can also add business and or personal policy type (both can be added at the same time the quote/application is being created. 6. Each policy can be paid on a different frequency, so they don't have to be the same. |
|  Exceptions/Limitations |   |
| Requirement Details / Technical Notes / Supporting Docs |   |
| Figma Designs | [Asteron Connect – Figma](https://www.figma.com/design/pRFVGjAz7tRES2x3ZuOaI4/Asteron-Connect?node-id=94-2069&t=KVZ1p6V9OVeuIMPz-0) |
| Test Info |   |

**Questions & things to clarify **

1. AsteronConnect have a Calculator in the backend, this is used for employment and annual income (refer to workshop video for this) need to understand where this calculator is saved and how it works. 
2. The Occupation list, this needs to be stored somewhere - need to determine where this will be stored.

**Current State Screenshots:**
