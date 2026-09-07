# User Story: Enter Commissions

| **Author/s** | @Ravi Bellamkonda |
| --- | --- |
| **Contributor/s** | @Amanda-Rose Harlen |
| **Reviewer/s** | @Lewis Daniels |
| **Approvers** | @Amanda-Rose Harlen |
| **Status** |  |
| **Jira** | [\[ACB-3598\] Build - Commissions Screen: Asteron Connect Online Quoting Tool - Jira](https://rlaanz.atlassian.net/browse/ACB-3598) |

| Story card | Enter Commissions |
| --- | --- |
| JIRA |   |
| User Story | As anAsteron Adviser/Adviser staffI want to be able to select the appropriate commission type in the New Business Quoting ToolSo that i am able to enter the commission type |
| Pre-Conditions |  |
| PC01 |   |
| Acceptance Criteria |  |
|  AC01 | **Given** I am an Adviser/Adviser staff**When** I am in the New Business Online Quoting Tool **Then** I should be provided the ability to select my commission type |
| AC02 | **Given** I am in the **New Business Online Quoting Tool** **When** I click the **“Adviser Use”** link **Then** the system should display the **Commission pop-up screen****And** System must allow to choose - **Default for Agency Dropdown**     - Available options: `LEVEL30`, `SPREAD 20`, `UPFRONT`, `NIL`     - Based on the config of the agency, default is displayed - **Split Commission Checkbox**     - Displayed and selectable by the user  ### Commission Table Structure For each policy type (**Personal Insurance** and **Business Insurance**), the table should include the following columns: - **Commission Structure ** - **Premium Structure (except for kids cover)** - **Sum Insured ($) Benefit Amount (except for kids cover)**  ### Table Row Configuration - **First Two Rows** (per policy type) should include:     - **Select IC/RC Dropdown**         - Default value: `IC-100%`, `RC-100%` if no flexirate has been selected in the quote screen         - Default value: “Please Select” if flexirate has been selected in the quote screen     - **Select All Dropdown**         - Options: `LEVEL30`, `SPREAD 20`, `UPFRONT` - One row per cover type   ### Action Buttons - **Cancel** button - **OK** button Note: If no premiums have been generated yet, only the Default for Agency dropdown should be available |
|  AC03 | **Given** AC02 is active **When** the adviser selects a value from the **Default for Agency** dropdown **And** clicks the **Update** button **Then** the selected commission structure should be **saved as the new default** **And** the system should display the confirmation message:  “Your default commission structure setting has been updated” |
| AC04 | **Given** AC02 is active **When** the adviser selects value in the Select All commission structure dropdown**Then** the selected commission structure should be applied to all cover in that policyNote: Some flexirates produce multiple commission structures in select All.    Eg, IC-75%/RC-50% on 12.5% has SPREAD 20 and LEVEL 30. The default selection for each cover then becomes the default from the agency but can be changed |
|  AC05 | **Given** AC02 is active **When** the adviser is in the commission screen**Then **Premium Structure and Sum Insured($) Benefit Amount should be displayed which is same as in the quote screen**And **it is not editable and greyed out |
| AC06 | **Given** AC02 is active and the user is on the **Commission **screen**When** the user clicks the **OK** button**Then** the selected commission values should be **saved****And** the system should **redirect** the user to the **Quote** screen |
|  AC07 | **Given** the user is viewing the **Commission **screen**When** the user clicks the **“X”** icon or the **Cancel** button**Then** the system should redirect the user to the **Quote** screen |
| AC08 | **Given** that AC02 is active**And** FlexiRate option has been selected on the Quote screen**When** the adviser navigates to the Commission screen**Then** the adviser should be able to select only the **IC/RC** dropdown or Default for agency**And** all other input fields and dropdowns must be **disabled** and visually **greyed out ****And** Select All and commission structure dropdowns should be enabled only when user selects a value in IC/RC dropdown |
| AC09 | **Given** that AC08 is active**When** the adviser clicks IC/RC dropdown in the Commission screen**Then** only applicable IC and RC values should be available to select in the dropdown based on the flexirate. Example 1 : **If** the selected **FlexiRate** is **15%****Then** following should be displayed in the dropdown 1. IC-50% RC=50% 2. IC-100% RC-0% 3. IC-0% RC-100% Example 2 : **If** the selected **FlexiRate** is **2.5%****Then** following should be displayed in the dropdown 1. IC-75% RC=100% 2. IC-100% RC-50% |
| AC10 | **Given** that AC09 is active**When** the adviser selects one of the available **IC/RC** options from the dropdown for a policy**Then** the **commission structure fields** for the relevant covers should become **enabled****And** the adviser should be able to select commission structure from the dropdown for each applicable coverExample 1 : **If** the selected **FlexiRate** is **15%****And** the adviser chooses **IC = 50%** and **RC = 50%****Then** the following commission options should be displayed in the dropdown: 1. **UPFRONT** 2. **LEVEL 30** 3. **SPREAD20** **and** Life Cover A could be set to UPFRONT, Life Cover B Level 30, and Life Cover C SPREAD20 - if the Flexirate's IC/RC combo allows.Example 2 : **If** the selected **FlexiRate** is **2.5%****And** the adviser chooses **IC = 75%** and **RC = 100%****Then** the following commission options should be displayed in the dropdown: 1. **LEVEL 30** Example 3 : **If** the selected **FlexiRate** is **2.5%****And** the adviser chooses **IC = 100%** and **RC = 50%****Then** the following commission options should be displayed in the dropdown: 1. **UPFRONT** |
| AC11 | **Given** I select 30.00% in the flexi rate  **When** I am in the commissions page**Then **No Dropdowns are present for selection,  replaced with message "Commission must be Nil as Nil Comm - 30% Discount Flexirate has been selected" |
| AC12 | **Given** I am in the *Commissions *page of the *New Business Quoting Tool*, **When** I click the **"?" icon** next to any label, **Then** the system must: - Display the **corresponding tooltip** with relevant information for that label. **Label****Tooltip**Split CommissionYou should only select this option if you do not have an existing default commission split.Adviser UseYou can add your commission details here |
| **Label** | **Tooltip** |
| Split Commission | You should only select this option if you do not have an existing default commission split. |
| Adviser Use | You can add your commission details here |
|  |  |
| Business Rules | There are 4 different commission structures.  - Level 30 - Spread 20 - Upfront - NIL Selecting Flexirate 30% produces a NIL commission.   No Dropdowns are present for selection,  replaced with message "Commission must be Nil as Nil Comm - 30% Discount Flexirate has been selected"Mapping of applicable IC and RCs.The applicable IC and RC percentages should be determined and applied based on the selected FlexiRate (Base Premium Discount). |
|  Exceptions/Limitations |   |
| Requirement Details / Technical Notes / Supporting Docs |   |
| Figma Design |  |
| Questions: |  |
|  |  |

**Current State Screenshots**
