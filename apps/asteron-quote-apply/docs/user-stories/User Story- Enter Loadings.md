# User Story: Enter Loadings

| **Author/s** | @Ravi Bellamkonda |
| --- | --- |
| **Contributor/s** | @Amanda-Rose Harlen |
| **Reviewer/s** | @Lewis Daniels |
| **Approvers** | @Amanda-Rose Harlen |
| **Status** |  |
| **Jira** | [\[ACB-3599\] Build - Loadings Screen: Asteron Connect Online Quoting Tool - Jira](https://rlaanz.atlassian.net/browse/ACB-3599) |

| Story card | Enter Loadings for both personal and business policies |
| --- | --- |
| JIRA |   |
| User Story | As an Advisor/Advisor StaffI want to be able to select loadings when I am in the New Business Quote Tool So that I am able to add loadings to my client's quote/application |
| Pre-Conditions |  |
| PC01 | Advisor has been on-boarded (training completed, credentials provided to advisor) |
| PC02 |  |
| Acceptance Criteria |  |
|  AC01 | **Given** I am in the New Business Quoting Tool**When** I am creating a new quote**Then **I must be provided the ability to enter loadings against the quote/application I am creating |
|  AC02 | **Given** I am selecting the loadings I want to apply to the policy **When** I navigate to the **‘Loadings’** screen **Then** I am presented with options to select a loading percentage or amount for each cover type.  ### Cover Types Available - Life - TPD - Trauma Recovery - Cancer Cover - Disability  ### Loading Options Users can choose one of the following loading types for each cover:  #### a. **Percentage ** - Dropdown - Applied as a percentage of the **base premium** - Selectable values:     - None, 25%, 50%, 75%, 100%, 125%, 150%, 175%, 200%, 225%, 250%, 275%, 300%, 325%, 350%, 375%, 400% - Can be applied individually to each cover type  #### b. **Per Mille** - Text box to enter fixed dollar amount per **$1,000 of sum insured** - Independent of the base premium - Up to two decimal values are also allowed  - Entered as a dollar amount against each cover type - Maximum allowable entry: $20 per cover type - Values can be adjusted in 0.5 increments using arrow keys - TPD and Disability cannot have per mille loadings - fields are greyed out |
| AC03 | **Given** the user is viewing the **Loadings** screen **When** the user clicks the **“X”** icon or the **Cancel** button **Then** the system should redirect the user to the **Quote** screen |
| AC04 | **Given** AC02 is active and the user is on the **Loadings** screen **When** the user clicks the **OK** button **Then** the selected loading values should be **saved** **And** the system should **redirect** the user to the **Quote** screen **And** the **premium details** should reflect the **updated loadings**And “Loadings have been applied” message should be displayed under total Yearly Premium. |
| AC05 | **Given** AC02 is active and the user is on the **Loadings** screen **When** the user clicks the **Down arrow icon** next to **Loadings** **Then** the system should open the following document in a new browser window: [Underwriting Guide](https://asteron-advisernet.int.corp.sun/adviser/document?title=Underwriting%20Guide) |
| AC06 | **Given** AC02 is active and the user is on the **Loadings** screen **When** the user enters loadings for **TPD** and **Disability** cover types **Then** the system should: - Allow input of **percentage values only** - Display the **Per Mille** option as **grayed out** - Set the **Per Mille** value to a **default of 0** |
| AC07 | **Given** AC02 is active and the user is on the **Loadings** screen **When** the user enters loading value greater than 20.00 per mille**Then** the system must display an error message “*The maximum per mille loading is $20.00*” |
| AC08 | **Given** AC02 is active and the user is on the **Loadings** screen **When** the user enters loadings **and** click OK**Then **Loading have been applied should be displayed in the quote page for each life loading have been applied to.  For example, in the below screenshot, loading have been applied to both lives. |
| AC09 | **Given** I am in the *Loadings* page of the *New Business Quoting Tool*, **When** I click the **"?" icon** next to any label, **Then** the system must: - Display the **corresponding tooltip** with relevant information for that label. **Label****Tooltip**PercentagePercentage loadings are applied where a client does not meet standard health criteria. Refer to the Underwriting Guide for expected loadings or contact an underwriter to discuss possible loadings. Please note: these may not be the actual loadings applied after underwriting.Per millePer mille loadings are applied where a client is assessed as an additional risk due to their pastimes, health, occupation or for cancer risk. Refer to the Underwriting Guide for expected loadings or contact an underwriter to discuss possible loadings. Please note: these may not be the actual loadings applied after underwriting. |
| **Label** | **Tooltip** |
| Percentage | Percentage loadings are applied where a client does not meet standard health criteria. Refer to the Underwriting Guide for expected loadings or contact an underwriter to discuss possible loadings. Please note: these may not be the actual loadings applied after underwriting. |
| Per mille | Per mille loadings are applied where a client is assessed as an additional risk due to their pastimes, health, occupation or for cancer risk. Refer to the Underwriting Guide for expected loadings or contact an underwriter to discuss possible loadings. Please note: these may not be the actual loadings applied after underwriting. |
| AC10 | **Given** I am in the *Quote screen*, **When** I have not created a quote and Total Yearly Premium(Premium is not calculated) is zero **And** I click Loadings link **Then** Loadings pop-up with error message should be displayed as shown below. |
| Business Rules | - An Adviser can preload the cover is the client has a pre-existing condition. Loading is to increase the premium cover as additional risk is being taken.  - Loadings - require medically underwritten based on the pre-existing condition a client may have. The adviser can then provide this information to the client via quote to indicate what their premiums would be. - Loadings will be applied per life. If there are loadings added for a life and quote had 3 policies for the same life, then loadings will be applied to all 3 policies if they are applicable. - Loadings are inherited to sub covers if added to the policy. For example, if you have Accl TPD, SA TPD & TPD on Trauma then a TPD loading applies to all.  - **Percentage Range:**    \*Percentage is % of base premium.     Percentages can be entered against each cover type.     None, 25%, 50%, 75%, 100% 125%, 150%, 175%, 200%, 225%, 250%, 275%, 300% ,325%, 350%, 375%, 400% - **Per mile: **    \*Per mile: A per mil loading is a fixed dollar amount per $1000 worth of cover.    This is entered as an amount against the cover type. Not based on the base premium, it's entirely dependent on the sum insured. These are only applied to lump sum risk, we - we can only apply them to lump sum risks. - We can't apply per mill loadings to monthly benefits. |
|  Exceptions/Limitations |   |
| Requirement Details / Technical Notes / Supporting Docs |   |
| Figma Design |  |
| Questions | 1. Is there a reason why we can not pre-load on cover typed TPD & Trauma?  2. Need to understand the logic of % and what calculations are performed to the premiums. |

**Current State Screenshots**
