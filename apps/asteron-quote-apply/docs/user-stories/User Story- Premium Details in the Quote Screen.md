# User Story: Premium Details in the Quote Screen



| **Author/s** | @Ravi Bellamkonda |
| --- | --- |
| **Contributor/s** | @Amanda-Rose Harlen |
| **Reviewer/s** | @Lewis Daniels |
| **Approvers** | @Amanda-Rose Harlen |
| **Status** |  |
| **Jira** | [Jira](https://rlaanz.atlassian.net/browse/ACB-2286) |

| Story card | Premium Details |
| --- | --- |
| JIRA |   |
| User Story | As anAsteron Adviser/Adviser staffI want to be able to see the premium details for a quoteSo that I can provide quote to the customer |
| Pre-Conditions |  |
| PC01 | Advisor has successfully logged into the New Business Quoting Tool and entered required minimum details in the quote screen |
| **Dependencies User Stories ** |  |
| Acceptance Criteria |  |
|  AC01 | **Given** I am on the Quote page, **When** I select any cover for a life insured, **Then** - The **total calculated premiums(check business rules)** for all lives should be displayed in the **Premium** section on the right-side panel. - The **individual premium per life** should be visible in the **Details** section on the right-side panel |
|  AC02 | **Given** I am on the Quote page, **When** I select multiple covers for a life insured, **Then** - The **total calculated premiums(check business rules)** for all lives should be displayed in the **Premium** section on the right-side panel. - The **individual premium per life** should be visible in the **Details** section with the breakdown for each cover on the right-side panel - The **total yearly premium** per life should be visible in the **Details** section - The **bundling discounts** should be visible with percentage if applicable |
| AC04 | **Given** I am on the Quote page, **When** I select any cover for a second life insured, **Then** - The **total calculated premiums(check business rules)** for all lives should be displayed in the **Premium** section on the right-side panel. - The **individual premium per life** should be visible in the **Details** section with the breakdown for each cover on the right-side panel - The **total yearly premium** per life should be visible in the **Details** section |
| AC05 | **Given** I am on the Quote page, **When** I select multiple covers for a second life insured, **Then** - The **total calculated premiums(check business rules)** for all lives should be displayed in the **Premium** section on the right-side panel. - The **individual premium per life** should be visible in the **Details** section with the breakdown for each cover on the right-side panel - The **total yearly premium** per life should be visible in the **Details** section - The **bundling discounts** should be visible with percentage if applicable |
| AC06 | **Given** I am on the Quote page,**When **I have added one or more lives to the new business quote/application **Then **I must have the ability to select the premium frequency for each from the following options as a drop down list: - Fortnightly  - Monthly  - Quarterly  - Half Yearly  - Yearly **And **this selection must be update on the quote/application |
| AC07 | **Given** I am on the Quote page, **When** the Premium section is displayed on the right-side panel, **Then** - I should be able to **expand** the Premium section to view detailed information. - I should be able to **collapse** the Premium section to hide the details as needed. |
| AC08 | **Given** I am on the Quote page, **When** the Premium section is displayed on the right-side panel, **Then** - I should be able to **expand** the Details section per life to view detailed information. - I should be able to **collapse** the Details section per life to hide the details as needed. |
| AC09 | **Given** I am on the Quote page, **When** the Premium section is displayed on the right-side panel and I click on a cover, **Then** - A **tooltip** should appear displaying either the **monthly benefit** or the **total sum insured**, depending on the selected cover. |
| AC10 | **Given** I am on the Quote page, **When** I select multiple policies for a life insured, **Then ** - The **total calculated premiums(check business rules)** for all lives should be displayed in the **Premium** section on the right-side panel. - The **individual premium per policy and per life** should be visible in the **Details** section with the breakdown for each cover on the right-side panel - The **total yearly premium** per life should be visible in the **Details** section |
| AC11 | **Given** I am on the Quote page, **When** I select multiple policies for a life insured with different frequencies, **Then ** - The **total annualised premiums** for all lives should be displayed in the **Premium** section on the right-side panel. - The **individual premium per policy and per life** should be visible in the **Details** section with the breakdown for each cover on the right-side panel - The **total yearly premium** per life should be visible in the **Details** section |
| AC12 | **Given** I have selected multiple policies for a life insured or different lives with different frequencies, **When** I change all covers (across policies and lives) to the same frequency,**Then ** - The **total calculated premiums(check business rules)** for all lives should be displayed in the **Premium** section on the right-side panel. |
| AC13 | **Given** I have selected multiple policies for a life insured or different lives with same frequency, **When** I change any cover (across policies and lives) frequency to the different frequency,**Then ** - The **total annualised premiums** for all lives should be displayed in the **Premium** section on the right-side panel. |
| AC14 | **Given** AC11 or AC13 **When** I click tooltip  next to Total Annualised Premium (All Lives)**Then **message “This is the total premium the clients will pay for the year. For example, the monthly premium x 12 or the half-yearly premium x 2” should be displayed. |
|  |  |
|  |  |
| Business Rules | **total calculated premiums: Label should be displayed as** - If payment frequency is same for all covers and for all lives - Total XXXX Premiums (All Lives) where XXXX is payment frequency.      - Example:  If payment frequency for all covers and for all lives is monthly then Total Monthly Premiums (All Lives)  - If payment frequency is not same for covers or lives - Total Annualised Premium (All Lives)      - Example:  If payment frequency for a cover is Monthly and for other cover(same life or different life) is Quarterly then Total Annualised Premium (All Lives) |
|  Exceptions/Limitations |   |
| Requirement Details / Technical Notes / Supporting Docs |   |
| Test Info |   |
| Questions | @Ravi Bellamkonda regarding AC09 do we have a screenshot of this interaction state please? We’ll also need to have the split of cover options that ‘display either the **monthly benefit** or the **total sum insured**, depending on the selected cover.’@Sam Wilson Check second last screenshot on the bottom right. Monthly benefit applies to below covers for others it is total sum insured Income Protection Cover Workability Cover Mortgage and Living Cover |


**Current State Screenshots:**
