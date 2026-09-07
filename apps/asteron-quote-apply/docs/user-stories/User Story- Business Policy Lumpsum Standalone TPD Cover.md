# User Story: Business Policy Lumpsum Standalone TPD Cover

| **Author/s** | @Ravi Bellamkonda |
| --- | --- |
| **Contributor/s** | @Amanda-Rose Harlen |
| **Reviewer/s** | @Lewis Daniels |
| **Approvers** | @Amanda-Rose Harlen |
| **Status** |  |
| **Jira** | [\[ACB-2940\] Build - Business: Lump Sum TPD Cover : Online Quoting Tool - AsteronConnect - Jira](https://rlaanz.atlassian.net/browse/ACB-2940) |

| Story card | Apply for Lump Sum TPD Cover (Standalone) |
| --- | --- |
| JIRA |   |
| User Story | As an Advisor/Advisor StaffI want to be able to apply for lump sum cover for a business policySo that I am able to add various lumpsum covers to the clients policy. |
| Pre-Conditions |  |
| PC01 | Advisor has been on-boarded (training completed, credentials provided to advisor) |
| PC02 |  |
| Acceptance Criteria |  |
|  AC01 | **Given** I am anAdviser or an Adviser staff **When** I am “creating a new quote” **Then** I should be provided the ability to apply for business ‘lumpsum cover’ in the quote |
|  AC02 | **Given **I am in the Lump Sum Cover section**When **I am creating a new business quote/application**Then **I am able to see below lump sum covers - Life - TPD - Trauma - Specific Injury  **And **I must be able to select 1 or more covers |
|  AC03 | **Given** I am in the **Lump Sum Cover** section of the **New Business Quoting Tool**, **When** I select **TPD**, **Then** I must be able to: 1. **Enter** the **Sum Insured** amount. 2. **Select** the **Premium Structure** from a dropdown with the following options:     - Stepped *(default)*     - Level to 65     - Level to 70 3. **Select **the **definition** from a dropdown with the following options:     - Own(default)     - Any     - Modified 4. Select **“Business Security” ** option using checkbox(default unchecked) |
| AC04 | **Given **I have selected **TPD Cover**,**When **age next birthday is less than 17**Then **an error message “The minimum Age Next Birthday for XXXX ‘Standalone TPD cover’ is 17 should be displayedWhere XXXX is premium structure. Valid values areSteppedLevel to 65Level to 70 |
| AC05 | **Given **I have selected **TPD Cover**,**When **age next birthday is more than 65**And **Premium Structure is Stepped**Then **an error message “The maximum Age Next Birthday for Stepped “Standalone TPD cover is 65” should be displayed |
| AC06 | **Given **I have selected **TPD Cover**,**When **age next birthday is more than 60**And **Premium Structure is Level to 65**Then **an error message “The maximum Age Next Birthday for Level to 65 “Standalone TPD cover is 60” should be displayed |
| AC07 | **Given **I have selected **TPD Cover**,**When **age next birthday is more than 65**And **Premium Structure is Level to 70**Then **an error message “The maximum Age Next Birthday for Level to 70 “Standalone TPD cover is 65” should be displayed |
| AC08 | **Given **I have selected **TPD Cover**,**When **age next birthday is between 17 to 21**And **Total combined SI across PER/BUS including Accl TPD and TPD on Trauma is more than 250000**Then **an error message “The maximum 'TPD Cover' Sum Insured per life for clients Age Next Birthday 17 - 21 is $250,000.” should be displayed |
| AC09 | **Given **I have selected **TPD Cover**,**When **age next birthday is between 17 to 21 inclusive**And **definition is not modified**Then **an error message “Age Next Birthday 17-21 is only eligible for Modified TPD” should be displayed |
| AC10 | **Given **I have selected **TPD Cover**,**When **age next birthday more than 21**And **Total combined SI across PER/BUS including Accl TPD and TPD on Trauma is more than 5000000**Then **an error message “The maximum total Sum Insured per life for TPD Cover is $5,000,000.” should be displayed |
| AC11 | **When **I select the Cover type**Then **I must be provided the ability to enter the Sum Insured amount**And **based on the cover type selected the premium structure must be pre-populated.Note: Default when TPD first added is Stepped, add a second TPD and Level to 65 will be pre-populated, add another TPD and Level to 70 will be pre-populated. All have the ability to be changed to any of the 3 premium structures |
| AC12 | **When **I have selected the cover type**Then **I must be provided the option to ‘add’ or ‘remove’ the cover type or update details**And **I must be able to view the changes to the premiums on the “Progress Panel for application progress” |
| AC13 | **Given** I am in the *TPD cover* section of the *New Business Quoting Tool*, **When** I click the **"?" icon** next to any label, **Then** the system must: - Display the **corresponding tooltip** with relevant information for that label. **Label****Tooltip**Sum InsuredThe large sum insured discount bands for TPD Cover are: - $100,000 - $249,999 - $250,000 - $499,999 - $500,000 Business SecurityAllows future increases without medical underwriting. Financial justification for increases required. |
| **Label** | **Tooltip** |
| Sum Insured | The large sum insured discount bands for TPD Cover are: - $100,000 - $249,999 - $250,000 - $499,999 - $500,000 |
| Business Security | Allows future increases without medical underwriting. Financial justification for increases required. |
| AC14 | **Given** I have selected **multiple TPD covers**, **When** I select up to a **maximum of 3 TPD covers**, **Then** the **“+TPD” button** must be: - **Greyed out**, indicating no further additions are allowed. - **Disabled**, preventing the user from adding any more TPD covers. |
| AC15 | **Given **I have selected multiple TPD covers (two or more standalone TPD covers, or Acc TPD, or any combination of TPD covers)**When **The TPD definitions on those covers are not the same**Then **Display an error message: **“You must have the same TPD definition for TPD cover on the same policy.”** |
| AC16 | **Given **I have selected **Acc TPD or TPD on Trauma Cover**,**When **age next birthday is between 17 to 21 inclusive**And **definition is not modified**Then **an error message “Age Next Birthday 17-21 is only eligible for Modified TPD” should be displayed |
| AC17 | **Given **I have selected **TPD Cover**,**When **age next birthday more than 56**And **I select Business Security Option**Then **an error message “The maximum Age Next Birthday for Business Security is 56” should be displayed |
| Business Rules | The maximum total Sum Insured per life for TPD Cover is $5,000,000 for ANB 22 onwards and $250,000 limit for 17- 21 ANB.For ANB 17 to 21  only Modified TPD Cover is available |
|  Exceptions/Limitations |   |
| Requirement Details / Technical Notes / Supporting Docs |   |
| Questions | - |


**Current State Screenshots:**
