# User Story: Personal Lumpsum Standalone Cancer Cover

| **Author/s** | @Ravi Bellamkonda |
| --- | --- |
| **Contributor/s** | @Amanda-Rose Harlen |
| **Reviewer/s** | @Lewis Daniels |
| **Approvers** | @Amanda-Rose Harlen |
| **Status** |  |
| **Jira** | [\[ACB-2928\] Build - Lump Sum Cancer Cover : Online Quoting Tool - AsteronConnect - Jira](https://rlaanz.atlassian.net/browse/ACB-2928) |

| Story card | Apply for Personal Lump Sum Cancer Cover |
| --- | --- |
| JIRA |   |
| User Story | As an Advisor/Advisor StaffI want to be able to apply for lump sum cover while I am creating a quote for a client So that I am able to add various lumpsum covers to the clients policy. |
| Pre-Conditions |  |
| PC01 | Advisor has been on-boarded (training completed, credentials provided to advisor) |
| PC02 |  |
| Acceptance Criteria |  |
|  AC01 | **Given** I am anAdviser or an Adviser staff **When** I am “creating a new quote” **Then** I should be provided the ability to apply for ‘lumpsum cover’ in the quote |
|  AC02 | **Given **I am in the Lump Sum Cover section**When **I am creating a new business quote/application**Then **I am able to see below lump sum covers - Life - TPD - Trauma - Cancer - Acd. Death - Needlestick - Specific Injury  **And **I must be able to select 1 or more covers |
|  AC03 | Given I am in the lump sum cover section of the New Business Quoting toolWhen I select CancerThen I must be provided the ability to enter the Sum Insured amountAnd based on the cover type selected the premium structure must be pre-populated And I must be able to select premium structure**Given** I am in the *Lumpsum Cover* section of the *New Business Quoting Tool*, **When** I select **Cancer** cover, **Then** the system must: 1. **Sum Insured:**     - Allow entry of the **Sum Insured** amount. 2. ** Premium Structure:**     - Provide dropdown to select **Premium Structure**     - **Stepped(default)**     - **Level to 65**     - **Level to 70** |
| AC04 | **Given **I have selected **Cancer****When **age next birthday is more than 65**And **Premium structure is Stepped**Then **an error message “The maximum age next birthday for stepped premium Cancer Cover is 65” should be displayed |
| AC05 | **Given **I have selected **Cancer****When **age next birthday is more than 60**And **Premium structure is Level to 65**Then **an error message “The maximum age next birthday for Level to 65 Cancer Cover is 60” should be displayed |
| AC06 | **Given **I have selected **Cancer****When **age next birthday is more than 65**And **Premium structure is Level to 70**Then **an error message “The maximum age next birthday for Level to 70 Cancer Cover is 65” should be displayed |
| AC07 | **Given **I have selected **Cancer Cover**,**When **age next birthday is between 17 to 21**And **Sum Insured is more than 250000**Then **an error message “The maximum total Sum Insured per life for Trauma Recovery Cover, including Cancer Cover, for clients Age Next Birthday 17 - 21 is $250,000.” should be displayed |
| AC08 | **Given **I have selected **Trauma & Cancer Cover**,**When **age next birthday is between 17 to 21**And **combined Sum Insured is more than 250000**Then **an error message “The maximum total Sum Insured per life for Trauma Recovery Cover, including Cancer Cover, for clients Age Next Birthday 17 - 21 is $250,000.” should be displayed |
| AC09 | **Given** I have selected **Cancer Cover**, **When** the **Age Next Birthday** is between **22 and 65** (inclusive), **And** the **Sum Insured** exceeds **$2,000,000**, **Then** an error message must be displayed:  **“The maximum total Sum Insured per life for Trauma Recovery Cover, including Cancer Cover, is $2,000,000.”** |
| AC10 | **Given** I have selected **Cancer Cover**, **When** the **Age Next Birthday** is between **22 and 65** (inclusive), **And** the **Sum Insured** less than **$10,000 per policy**, **Then** an error message must be displayed:  **“**The minimum Cancer Cover sum insured is $10,000**.”** |
| AC11 | **Given** I have selected **Trauma &** **Cancer Cover**, **When** the **Age Next Birthday** is between **22 and 65** (inclusive), **And** the Combined **Sum Insured** exceeds **$2,000,000**, **Then** an error message must be displayed:  **“The maximum total Sum Insured per life for Trauma Recovery Cover, including Cancer Cover, is $2,000,000.”** |
| AC12 | **Given** I have selected **Trauma, Major Trauma &** **Cancer Cover**, **When** the **Age Next Birthday** is between **22 and 65** (inclusive), **And** the Combined **Sum Insured** exceeds **$2,000,000**, **Then** an error message must be displayed:  **“The maximum total Sum Insured per life for Trauma Recovery Cover, including Cancer Cover, is $2,000,000.”** |
| AC13 | **Given** I am in the quote screen**When **I added 3 standalone cancer covers**Then **+Cancer button should be greyed out and should reenable when I remove one cancer cover |
| AC14 | **Given** I have already added a cancer cover**When** I add a second cancer cover**Then** the default premium structure should be the next available structure in the dropdown**And** I should be able to change the premium structure  #### **Example:** Cover AddedDefault Premium StructureFirst Cancer CoverSteppedSecond Cancer CoverLevel to 65Third Cancer CoverLevel to 70 |
| Cover Added | Default Premium Structure |
| First Cancer Cover | Stepped |
| Second Cancer Cover | Level to 65 |
| Third Cancer Cover | Level to 70 |
| AC15 | **Given** I am in the *cancer cover* section of the *New Business Quoting Tool*, **When** I click the **"?" icon** next to any label, **Then** the system must: - Display the **corresponding tooltip** with relevant information for that label. **Label****Tooltip**Sum InsuredThe large sum insured discount bands for Cancer Cover are: - $100,000 - $249,999 - $250,000 + Standalone CancerProvides additional money over and above the Trauma Recovery sum insured for cancer conditions and includes the Early stage cancer benefit.Acc CancerProvides additional money over and above the Trauma Recovery sum insured for cancer conditions and includes the Early stage cancer benefit. |
| **Label** | **Tooltip** |
| Sum Insured | The large sum insured discount bands for Cancer Cover are: - $100,000 - $249,999 - $250,000 + |
| Standalone Cancer | Provides additional money over and above the Trauma Recovery sum insured for cancer conditions and includes the Early stage cancer benefit. |
| Acc Cancer | Provides additional money over and above the Trauma Recovery sum insured for cancer conditions and includes the Early stage cancer benefit. |
| Business Rules | The maximum total Sum Insured per life for Trauma Recovery Cover, including Cancer Cover, is $2,000,000From 17 – 21 NB: $250,000 From 22 NB – Cover Expiry: $2 millionLimits are combined limits. Need to include sum insureds of all policies under a life insured - Acc Trauma, Major Trauma, Acc Cancer under Life cover - Standalone Trauma, Major Trauma under Trauma cover - Cancer cover |
|  Exceptions/Limitations |   |
| Requirement Details / Technical Notes / Supporting Docs |   |
| Questions | - |


**Current State Screenshots:**
