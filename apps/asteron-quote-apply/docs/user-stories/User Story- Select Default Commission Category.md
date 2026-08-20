# User Story: Select Default Commission Category

| **Author/s** | @Michael De Gregorio |
| --- | --- |
| **Contributor/s** | @Amanda-Rose Harlen |
| **Reviewer/s** | @Lewis Daniels |
| **Approvers** | @Amanda-Rose Harlen |
| **Status** |  |
| **Jira** | [\[ACB-13175\] Build - Default Commission - AsteronConnect - Jira](https://acendalife.atlassian.net/browse/ACB-13175) |

| Story card | Select Default Commission Category |
| --- | --- |
| JIRA |  [\[ACB-13175\] Build - Default Commission - AsteronConnect - Jira](https://acendalife.atlassian.net/browse/ACB-13175) |
| User Story | As anAdviser I want to be able to select and set a commission category for New Business Quoting ToolSo that I do not need to keep selecting a commission category for new quotes |
| Requirements |  |
| ### **User Interface** | - Add an option that allows users to select and set a **default commission category**. - Make this option available within the **Adviser Use** function. - When a user selects and saves a default commission category, it will be stored as the **agency default**. - Users can update the default commission category for future applications at any time. Changes to the default must **not** be applied retrospectively to existing quotes, saved applications, or unsubmitted applications. - When a new quote is created, the selected default commission category must be automatically applied to all products and benefits (covers) included in the application. - Any new cover added to the application must inherit the commission structure defined by the agency default |
| **Label and CTA button** | - Display the option label as: **"Default for Agency (**\<agencyno\>**)"**. - Provide an **Update** button that allows users to save the selected default commission category. - The **Update** button should remain disabled until the user changes the commission category selection. - The expected layout is expected to be like: |
| **Available Options** | - The available commission category options are:     - Upfront     - Level 30     - Spread 20 |
| **Nil Commission Option** | - There is no business value to having a Nil Commission default option. Therefore this is NOT to be an option that can be selected for a user to make it a default option. |
| **Default Option** | - When the feature is accessed for the first time, the default commission category should be set to **Upfront**.     - If this is not technically feasible, the **Select All** commission structure dropdown should default to **"Please Select"** when the Adviser Use function is opened. |
| **Confirmation Message** | - After a successful update, display the following confirmation message:     - **Your default commission structure setting has been updated.** |
|  |  |
| ### **FlexiRate and Commission Category Relationship** |  |
| **Introduction** | - For **Life400 Flexi-Rate Options**, applying a Flexi-Rate discount will reduce the premium payable **and **reduce the **Initial Commission (IC)** or **Renewal Commission (RC)** percentages and dictate the commission category that is available. - This is catered for in the current build. - However with the ability for the adviser to select a default commission category, additional rules need to be applied |
| **Use Case: 30% FlexiRate Selected and Default selected is Upfront**, **Level 30**, or **Spread 20** | - If a user selects a **30% Flexi-Rate** and the default commission category is **Upfront**, **Level 30**, or **Spread 20**, the commission category must be **Nil Commission**.  - In this scenario, display this message in the Adviser Use page should the adviser enter the page.     - “**Commission is Nil as Nil Comm - 30% Discount Flexirate has been selected**“ (*note there is a slight wording change from the existing text that is displayed*) |
| **Validation** | - The adviser is not to be prompted to go into the Adviser Use page. - There is not to be a validation prompted if the adviser selects the CTA Apply based on this scenario. - The adviser will be able to proceed on clicking **Apply**. |
| **STP** | - When the application is submitted for STP with the 30% flexirate then the commission category that is passed into LIFE400 createPolicy payload is **Nil** and the flexirate code of NN |
| **Adviser Use Cover display** | - If the user enters the Adviser Use screen then the covers for the policy are not displayed in the adviser use screen. This is existing functionality therefore no change is expected. |
|  |  |
| **Use Case: Spread 20 is the selected commission category default** | - **Spread 20** is not available for all Flexi-Rate options. Should the adviser have **Spread 20** as their default and if they select a policy with a Flexi-Rate of **2.5%** **10%**, **17.50%**, or **25%** they need to be prompted to select a valid commission category and commission percentages. |
| **Validation message** | - If the adviser clicks **Apply (without visiting the Adviser use screen) **then trigger the followingstandard commission message to ensure the user selects an appropriate combination:     - “Please select IC/RC in Adviser Use for all policies.” |
| **Adviser Use Functionality** | - When the user accesses the Adviser Use page then      - The **Select IC/RC** pick list is to be enabled     - The **Select IC/RC** pick list values are “Please Select” plus the IC/RC percentages available to that Flexirate selected     - The commission category pick list against each cover and the **Select All** will be disabled.  It will only be enabled once the user selects a **Select IC / RC** rate.      - When the user selects the IC/RC rate then the only commission category available for the IC/RC percentage selected will be available in the select all and the cover pick list     - For example;         - The commission category default is Spread 20. Flexirate selected is 2.5%. Spread 20 is not available for this flexirate percentage. On entering the Adviser Use page then only IC-100%, RC-50% and IC-75%, RC-100% are available from the IC/RC pick list. The cover and select all commission category pick lists are disabled until the user selects a IC/RC rate.          - Selecting IC-100%,RC-50% will mean that UPFRONT is the only available option on the commission category cover pick list.         - Selecting  IC-75%, RC-100% will mean that LEVEL30 is the only available option on the commission category cover pick list         - As per this existing example |
|  |  |
| **General IC/RC Selection Rules** | - The **Select IC/RC** field will only display the IC/RC options that are valid for the selected commission category and Flexi-Rate combination. - In effect is this existing behaviour |
| **Use Case: Single IC/RC Rate** | - Where a commission category only has a single valid IC/RC option for the selected Flexi-Rate, the system will automatically select that option. Examples are:     - **15%** Flexi-Rates allow selection of          - **Upfront** with an IC/RC of **50/50 **(therefore only one is displayed)         - **Level 30** with an IC/RC of **50/50 **(therefore only one is displayed)         - **Spread 20** with an IC/RC of **100/0**, **50/50**, **0/100** (therefore multi options are available - see below)      - **27.50%** Flexi-Rate allows selection of         - **Upfront **with an IC/RC split of** 0/50**         - **Level 30** or **Spread 20**, with an IC/RC split of **25/0**. - **Working Example:**     - Adviser Default Commission Category selected: **Upfront**     - Flexi-Rate chosen: **5%**     - IC = **100% **RC = **0%**     - This means if the adviser views the Adviser Use screen each cover will have a commission category of UPFRONT and the **Select IC/RC **item selected will be** IC - 100%, RC - 0%** |
| **Validation** | - The adviser will NOT need to enter the Adviser Use screen - There is to be NO validation presented requesting the adviser is to select the IC/RC rate when they click Apply |
| **STP** | There is no change to values added to the createPolicy Payload |
|  |  |
| **Use Case: Multiple IC/RC Rate** | - Where multiple commission categories are supported for a selected Flexi-Rate, users will be allowed to change the commission category at the benefit level if required to. Examples include but are not limited to:     - **7.5% **Flexi-Rates allow selection of:         - Spread 20 with IC/RC 100/50 or 50/100     - **15%** Flexi-Rates allow selection of          - **Spread 20** with an IC/RC of **100/0**, or  **50/50**, or **0/100**      -  **20%** Flexi-Rates allow selection of          - **Level 30** with an IC/RC of 100/0 or 0/50         - **Spread 20** with an IC/RC of 75/0, or 25/50 |
|  | - Where multiple IC/RC options are available for the defaulted commission category and Flexi-Rate, the user must manually select the desired IC/RC split. - **Example:**     - Adviser Default Commission Category selected: **Spread 20**     - Flexi-Rate chosen: **7.5%**     - Two valid IC/RC options are available         - IC - 100%, RC - 50% **or **IC - 50%, RC - 100%       - The adviser must be prompted to select one of these options     - When the adviser enters the Adviser Use screen then          - the Select IC/RC pick list will be enabled         - The Select All and the Cover’s commission category pick lists are to be set to “Please select” and will require the user to choose a commission category. In this scenario there will be one commission category option, however for 12.50% could have LEVEL30 and SPREAD20 available. - ~~CHECK THIS WITH AH~~ |
| **Validation Message** | - If the adviser clicks **Apply (without visiting the Adviser use screen) **then trigger the followingstandard commission message to ensure the user selects an appropriate combination:     - “Please select IC/RC in Adviser Use for all policies.”   - The adviser will NOT be able to proceed on clicking **Apply** until the IC/RC is selected. |
|  |  |
| **Use Case: CreatePolicy Payload** | There is no change to the FlexiRate code that is sent to LIFE400 as part of the CreatePolicy payload based on the commission category, IC/RC selected and Flexi rate percentage selected. However, it is critical that the correct FlexiRate code is sent to LIFE400.This page confirms the codes that should be are to be sent to LIFE400 based on the commission category, IC/RC and FlexiRate selected. [Asteron Life PER & BUS Flexirate Codes - Life BT New Zealand Knowledge Base - Confluence](https://acendalife.atlassian.net/wiki/spaces/LBTNZ/pages/2361557121) |
|  |  |
| **Use Case: Existing Quotes and Applications at the time of deployment** | The default commission category selected by a user must **not** be applied retrospectively to existing saved quotes or unsubmitted applications when this enhancement is implemented.Any quotes or applications created before implementation should retain their current commission category and IC/RC settings. If changes are required, the user must open the individual quote or application and manually update the commission category and/or IC/RC option. |
|  |  |
|  |  |
| Acceptance Criteria |  |
|  AC01 | *Display Agency Default Option***Given** the user accesses the Adviser Use function **When** the commission structure section is displayed **Then** the label "Default for Agency (xxxxx)" is visible **And** the correct agency number is displayed in the label. |
| AC02 | *Display Available Commission Categories* **Given **the user accesses the Adviser Use function **When** the default commission category dropdown is displayed **Then **the following options are available for selection: 	• Upfront 	• Level 30 	• Spread 20 |
|  AC03 | *First-Time Default Value* **Given **no default commission category has previously been configured for the agency **When **the Adviser Use function is opened for the first time **Then **the default commission category is set to Upfront. |
| AC04 | *Update Button Disabled by Default* **Given** the currently saved default commission category is displayed **When** no changes have been made by the user **Then** the Update button is disabled. |
|  AC05 | *Enable Update Button After Change* **Given** the user changes the selected commission category **When** the new selection differs from the saved value **Then** the Update button becomes enabled. |
| AC06 | *Save Updated Default Commission Category* **Given** the user has selected a different commission category **When** the user clicks the Update button **Then** the selected commission category is saved as the agency default **And** the updated value is available for future quotes and applications |
|  AC07 | *Display Confirmation Message* **Given** the default commission category has been successfully saved **When** the save operation completes **Then** the following confirmation message is displayed: 	"Your default commission structure setting has been updated." |
| AC08 | *Persist Saved Value* **Given** a default commission category has been saved **When** the user exits and later reopens the Adviser Use function **Then** the previously saved default commission category is displayed. |
| AC09 | *Prevent Unnecessary Updates* **Given **the user has not changed the current commission category selection **When **the user views the Adviser Use function **Then **the Update button remains disabled **And **no update action can be performed. |
| AC10 | *Display Only Valid IC/RC Option*s **Given **a commission category and Flexi-Rate have been selected **When **the user views the Select IC/RC field **Then **only IC/RC options valid for the selected commission category and Flexi-Rate combination are displayed **And **invalid IC/RC options are not available for selection. |
| AC11 | *30% Flexirate selected***Given** a user has selected the **30% Flexi-Rate** product option and the default commission category is **Upfront**, **Level 30**, or **Spread 20**, **When** the user navigates to the **Adviser Use** page, **Then** the commission category must be automatically set to **Nil Commission** and the following message must be displayed:  **"Commission is Nil as Nil Comm - 30% Discount Flexirate has been selected"**. |
| AC12 | *Flexirate selected with no Spread 20 option***Given** an adviser has **Spread 20** configured as their default commission category and selects a policy with a Flexi-Rate of **2.5%**, **10%**, **17.50%**, or **25%**, **When** the adviser clicks **Apply** without visiting the **Adviser Use** screen to select a valid commission category and commission percentages, **Then** the application must prevent processing and display the message:  **"Please select IC/RC in Adviser Use for all policies."** |
| AC13 | *Advise Use screen defaults***Given** an adviser has selected a Flexi-Rate for which their default commission category is not valid, **When** the adviser opens the **Adviser Use** page, **Then** the **Select IC/RC** pick list must be enabled and display **"Please Select"**  And only the IC/RC options available for the selected Flexi-Rate, while all commission category pick lists (including **Select All**) remain disabled until an IC/RC option is selected;  And upon selecting an IC/RC option, the commission category pick lists must be enabled and display only the commission category associated with that selected IC/RC option |
| AC14 | *Auto-Select Single Available IC/RC Option* **Given** the selected commission category and Flexi-Rate combination has only one valid IC/RC option **When** the commission details are displayed **Then** QA automatically selects the available IC/RC option **And** no manual user selection is required. |
| AC15 | *Require Manual Selection When Multiple IC/RC Options Exist* **Given** the selected commission category and Flexi-Rate combination has more than one valid IC/RC option **When** the user creates or updates a quote/application **Then** QA does not automatically select an IC/RC option **And** the user must manually choose an available IC/RC option. |
| AC16 | *Display Validation Message When IC/RC Selection Is Required* **Given **multiple valid IC/RC options exist for the selected commission category and Flexi-Rate combination **When **the user attempts to proceed without selecting an IC/RC option **Then **the following validation message is displayed: 	"Please select IC/RC in Adviser Use for all policies." **And **the user cannot proceed until a valid IC/RC option has been selected. |
| AC17 | *Allow Benefit Commission Category Changes Where Multiple Options Are Supported* **Given **a Flexi-Rate supports more than one commission category **When **the user edits commission details for a benefit **Then **the user may select from any valid commission category available for that Flexi-Rate. |
| AC18 | *Save Selected IC/RC Option* **Given **a valid IC/RC option has been selected **When **the quote or application is saved **Then **the selected IC/RC values are stored against the quote/application **And **the same values are displayed when the quote/application is reopened. |
| AC19 | *Update IC/RC Options Dynamically* **Given** the user changes the Flexi-Rate or commission category **When** the selection changes **Then** the available IC/RC options are refreshed immediately **And** any previously selected IC/RC value that is no longer valid is cleared. |
| AC20 | *Existing Saved Quotes Are Unchanged* **Given** a saved quote exists before the implementation of the agency default commission category feature **When **the feature is deployed or an agency default commission category is set or changed **Then **the saved quote must retain its existing commission category and IC/RC settings **And **no automatic updates are applied to the quote. |
| AC21 | *Existing Unsubmitted Applications Are Unchanged* **Given **an unsubmitted application exists before the implementation of the agency default commission category feature **When **the feature is deployed or an agency default commission category is set or changed **Then **the application must retain its existing commission category and IC/RC settings **And **no automatic updates are applied to the application. |
| AC22 | *New Agency Defaults Apply Only to New Quotes /Applications* **Given **an agency default commission category has been configured **When **a new quote is created **Then **the default commission category must be automatically applied to the quote. |
| AC23 | *Users Can Manually Update Existing Quotes* **Given **an existing quote contains a commission category different from the current agency default **When **the user opens the quote and changes the commission category and/or IC/RC option **Then **the updated values must be saved against that quote **And **no other quotes or applications are affected. |
| AC24 | *Users Can Manually Update Existing Unsubmitted Applications* **Given **an existing unsubmitted application contains a commission category different from the current agency default **When **the user opens the application and changes the commission category and/or IC/RC option **Then **the updated values must be saved against that application **And **no other quotes or applications are affected. |
| AC25 | *Existing Commission Selections Remain Visible* **Given **a user opens a saved quote or unsubmitted application created prior to a change in agency default **When **the commission details are displayed **Then **the original commission category and IC/RC selections are shown exactly as previously saved. |
| AC26 | *Data Integrity* 	• Existing commission category and IC/RC data must be retained following deployment of the enhancement. |
| AC27 | *STP***Given **the user submits the application **When **the policy is set up in LIFE400 **Then **the commission category flexi rate is as per the application |
|  |  |
|  |  |
|  |  |
| References | The applicable IC and RC percentages should be determined and applied based on the selected FlexiRate (Base Premium Discount). |
|  Exceptions/Limitations |   |
| Requirement Details / Technical Notes / Supporting Docs |   |
| Figma Design |  |
|  |  |
|  |  |

### Questions

| **#** | **Outcome** | **Raised by and Date** | **Outcome** | **Status**RESOLVEDOPEN |
| --- | --- | --- | --- | --- |
| 1 | If default commission is spread20and the IC/RC field has multiple options upon selecting the IC/RC field the commission type available for covers is (level30,spread20)do we want to pre select SPREAD20? as it is the default commission set?  | 7/8/2026@Charles Visita | As discussed with @Amanda-Rose HarlenLet the default to prevail. if it's not too hard than let it default on its own if their chosen IC/RC results in that being the comm structure.cc: @Yashwi Ashta | RESOLVED |
| 2 | IF an adviser opens an existing quote. that quote doesnt have any IC/RC and commission type selected yet. do we want to apply the default commission?  | 7/8/2026@Charles Visita | As discussed with @Amanda-Rose HarlenNo. This would only be a necessary for a short period of time. This would also extend testing effort. cc @Yashwi Ashta | RESOLVED |

## Scenarios 

### Changing Flexirate Behaviour

Changing the Flexirate on a saved quote that is reopened **AFTER** the user updates the Default Commission Category should reset the IC/RC and Cover Commission Category options based on the new Default Commission Category.  This could mean the values are reset to "Please Select" (Multiple IC/RC available) or default to the IC/RC and new commission category (where these is a single option).

 

If there is NO change to the Flexirate on a saved quote that is reopened **AFTER** the user updates the default commission category, then the quotes retain the previous IC/RC and Cover Commission category selected.


The following information aims to provide working examples of the example behaviour when 

1. The user updates the Flexirate option
2. The user updates the Default Commission Category and changes the Flexirate

### **1. User updates the Flexirate option**

### Scenario **- Flexirate is NA **

Given the user has the Commission category default of **UPFRONT** saved

And a new quote is created with Personal or Business Insurance with one or more covers, and the user has selected NA for flexirate for all policies

If the user then goes into the Adviser Use box then:

#### Adviser Use - Display Expectations

| **Item** | **Details** |
| --- | --- |
| Default Commission Category | Default Commission Category is displayed as UPFRONT |
| IC/RC rate | The IC/RC rate will show IC-100%, RC-100% as the selected commission category |
| Commission category per cover | Against each cover the commission category will be displayed as **UPFRONT** |
| Ability to change category | The user can, if they choose, change the commission category for each cover to Spread 20 or Level 30 as these are valid commission categories for the Flexirate of NA |


### Scenario **- Flexirate is Non NA **

Given the user has the Commission category default of **UPFRONT** saved

And a new quote is created with Personal or Business Insurance with one or more covers, and the user selects a FR option that has **single UPFRONT **IC/RC rate option (ie 2.50% to 27.50%, but NOT 12.50% or 25%)

If the user then goes into the Adviser Use box then they should see:

### Adviser Use — Screen

| **Item** | **Detail** |
| --- | --- |
| Default Commission Category | Default Commission Category is displayed as UPFRONT |
| IC/RC rate shown | The IC/RC rate shown is associated to the FR selected eg 2.5%FR will show IC-100%, RC-50% |
| Cover commission category | Against each cover the commission category will be displayed as **UPFRONT** |
| User change capability | The user can, if they choose, change the commission category if the IC/RC supports another commission category |

If the user chooses to change the commission category from the Adviser Use Screen.

1. If the FlexiRate allows **multiple **IC/RC across commission categories then…..

| **Action** | **Details** |
| --- | --- |
| Choose IC/RC rate | the user can a different the applicable IC/RC rate |
| Select commission category | The user can then select the appropriate cover commission category associated to the IC/RC rate. |

**Example 1 - **If the FR selected is 2.50%

| **Item** | **Notes** |
| --- | --- |
| Example | If the FR selected is 2.50% this allows (pick list options) |
| Pick list options | IC-100%, RC-50% IC-75%, RC-100% |
| Default IC/RC expectation | IC-100%, RC-50% is the Default for UPFRONT for 2.5%. Expect to see this value in the IC/RC field after opening the Adviser Use screen. |
| Cover commission display | The Cover Commission categories will show (default to) **UPFRONT **on screen when first opened. |
| UPFRONT selection constraint | The user can only select **UPFRONT** for ALL covers when IC-100%, RC-50% is selected |
| LEVEL30 selection constraint | The user can only select **LEVEL30** for ALL covers when IC-75%, RC-100% is selected |
| SPREAD20 availability | The user cannot select **SPREAD20** as there is no valid IC/RC rate available |
| Effect of selecting LEVEL30 | Selecting LEVEL30  will NOT change the default commission category. |
| Mix of categories restriction | In this scenario the covers on the policy CANNOT have a mix of UPFRONT and LEVEL30. |

**Example 2 - **If the FR selected is 7.50%

| **Item** | **Notes** |
| --- | --- |
| Example | If the FR selected is 7.50% this allows the following IC/RC options  (pick list options) |
| Pick list options | IC-100%, RC-50%; or IC-50%, RC-100%; or IC-75%, RC-100%, or IC-25%, RC-100% |
| Default IC/RC expectation | IC-75%, RC-100% is the Default for UPFRONT for 7.5%.Expect to see this value in the IC/RC field  after opening the Adviser Use screen. |
| Cover commission display | The Cover Commission categories will show (default to) **UPFRONT o**n screen when first opened. |
| UPFRONT selection constraint | The user can only select **UPFRONT** for ALL covers when  IC-75%, RC-100% is selected |
| LEVEL30 selection constraint | The user can only select **LEVEL30** for ALL covers when IC-25%, RC-100% is selected |
| SPREAD20 availability | The user can only select **SPREAD20** for ALL covers when IC-100%, RC-50%; or IC-50%, RC-100% is selected |
| Effect of selecting LEVEL30 or SPREAD20 | Selecting LEVEL30  or SPREAD20 will NOT change the default commission category. |
| Mix of categories restriction | In this scenario the covers on the policy CANNOT have a mix of UPFRONT, LEVEL30 SPREAD20 against the covers |


**Example 3 - **If the FR selected is 15%

| **Item** | **Notes** |
| --- | --- |
| Example | If the FR selected is 15.00% this allows (Pick List options) |
| Pick list options | IC-100%, RC-0% orIC-50%, RC-50% or IC-0%, RC-100% |
| Default IC/RC expectation | IC-50%, RC-50% is the Default for UPFRONT for 15%.Expect to see this value in the IC/RC field  after opening the Adviser Use screen. |
| UPFRONT selection constraint | The Cover Commission categories will show (default to) **UPFRONT o**n screen when first opened. |
| Cover Commission selection constraint | The user can select **UPFRONT** or **LEVEL30** OR **SPREAD20** against the covers when IC-50%, RC-50% is selected.In this scenario there could be a combination of commission categories.  |
| SPREAD20 availability | The user can only select **SPREAD20** for ALL covers when IC-100%, RC-0% or IC-0%, RC-100% is selected |
| Effect of selecting LEVEL30 or SPREAD20 | Selecting LEVEL30  or SPREAD20 will NOT change the default commission category. |
| Mix of categories restriction | In this scenario the covers on the policy CAN have a mix of UPFRONT, LEVEL30 or  SPREAD20 against the covers if the IC/RC rate is IC-50%, RC-50%. |



Example 4: Flexirate that can have **multiple UPFRONT IC/RC** rates (ie 12.50% and 25%)

| **Item** | **Details** | **Notes** |
| --- | --- | --- |
| Example | If the FR selected is 12.50% this allows (pick list options).This has multiple UPFRONT IC/RC rates |  |
| Pick list options | Please select IC-50%, RC-100% orIC-75%, RC-50% orIC-75%, RC-0% orIC-25%, RC-100% | The IC/RC pick list will need to default to **Please Select** as there are multiple options for UPFRONT therefore the adviser must select an option. |
| UPFRONT selection constraint | The user can only select **UPFRONT** for ALL covers when IC-50%, RC-100% or IC-75%, RC-0% is selected |  |
| Cover Commission selection constraint | The user can select **LEVEL30** OR **SPREAD20** against the covers when IC-75%, RC-50% is selected. In this scenario there could be a combination of commission categories. |  |
| SPREAD20 availability | The user can only select **SPREAD20** for ALL covers when IC-25%, RC-100% is selected |  |
| Effect of selecting LEVEL30 or SPREAD20 | Selecting LEVEL30 or SPREAD20 will NOT change the default commission category. |  |
| Mix of categories restriction | In this scenario the covers on the policy CAN have a mix of LEVEL30 or SPREAD20 against the covers if the IC/RC rate is IC-75%, RC-50%. |  |

### User Exits the Adviser Use Screen

If the user exits the Adviser Use screen and changes the Flexirate (FR) then

| **Condition** | **Details** |
| --- | --- |
| Cover Commission Category Retention | The commission categories against the covers from the earlier FlexiRate option will not be retained as a new value MAY be necessary |
| IC/RC Rate Retention | The IC/RC will NOT be retained for the policy where the FR was changed from the earlier FlexiRate option will not be retained as a new value WILL be necessary |
| New FR - Single IC/RC rate | If the new FR selected contains a multiple IC/RC rate options covers for the default commission category the FR selected contains a single IC/RC rate option for default commission category selected then: - the IC/RC rate is the only option available AND all covers have the default commission category selected. |
| New FR - Multiple IC/RC rate | If the new FR selected contains multiple IC/RC rate options for the default commission category then: - The user must be forced to select a value (and cannot proceed with the application) - The IC/RC pick list must be **Please Select **(examples 12.5% and 25% and UPFRONT) - The cover commission category must be **Please select **with only the viable commission categories available from the pick list |


### **2. User updates the Default Commission Category**

If the user changes the Default Commission category eg from UPFRONT to SPREAD20 then

| **Rule** | **Details** |
| --- | --- |
| Saved quotes/applications unaffected | Any saved quotes or application must not have their IC/RC or cover commission category updated in line with the new default commission category |
| Applies only to new quotes | The change of commission category will only apply to new quotes created post the saved default |

### **Example**

#### Quote A

| **Item** | **Detail** |
| --- | --- |
| Default Commission Category | Quote A is created with a Default Commission category of UPFRONT, |
| FR option | Quote A has NA as the FR option |
| IC/RC option | Quote A also has IC/RC option of 100% selected.  |
| Cover commission | And each cover for the policy has UPFRONT shown against them. |

#### Quote B

Quote B is created and the user changes the Default commission to LEVEL 30

| **Scenario** | **Behavior** |
| --- | --- |
| User selects FR before Adviser Use | If the user selects the FR prior to entering the Adviser Use screen then when they enter the Adviser Use screen the IC/RC and Cover Commission Category is to be as per the UPFRONT default |
| Upon entering Adviser Use screen | When the user enters the Adviser Use screen then: - The IC/RC is as per the FR selected (either an option or please select) and the cover commission category is either UPFRONT or please select. |
| When the user changes the Default Commission category and updates | Then the IC/RC selected and Cover Commission categories selected do not change. |

#### When Navigating Between Quotes

When the user exits Quote B and returns to Quote A **WITHOUT adjusting the FR** then upon entering the Adviser Use screen

| **Displayed** | **Detail** |
| --- | --- |
| Default Commission Category | The Default Commission Category is shown as LEVEL 30. |
| IC/RC and Cover Commission Category | The IC/RC and Cover Commission Category is retained from the earlier save |

 

When the user exits Quote B and returns to Quote A **WITH adjusting the FR** prior to entering the Adviser Use screen

| **Displayed** | **Detail** |
| --- | --- |
| Default Commission Category | The Default Commission Category is shown as LEVEL 30. |
| IC/RC and Cover Commission Category | The IC/RC and Cover Commission Category is either: |

| **Condition** | **Outcome** |
| --- | --- |
| Multiple IC/RC options available for the FR option | if there are multiple IC/RC options available for the FR option; then the IC/RC is reset to Please Select for the IC/RC and cover commission categories. |
| Single IC/RC option available for the FR option | If there is a single IC/RC option available for the FR option; then the IC/RC is changed to the default value for LEVEL 30 and the cover commission categories now show LEVEL30. |

If the user attempts to proceed the application (ie click apply) when the values have been reset to “Please select” then the validation message "Please select IC/RC in Adviser Use for all policies" is to appear



## Suncorp AsteronConnect Screen Shots

The following screen shots are from the Suncorp AsteronConnect - these are retained here for reference purposes only
