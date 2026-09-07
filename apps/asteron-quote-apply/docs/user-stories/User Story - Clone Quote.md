# User Story \- Clone Quote



| **Author/s** | @Ravi Bellamkonda |
| --- | --- |
| **Contributor/s** | @Amanda-Rose Harlen |
| **Reviewer/s** | @Lewis Daniels |
| **Approvers** | @Amanda-Rose Harlen |
| **Status** |  |
| **Jira** | [\[ACB-5748\] Build - Clone Quote - Jira](https://rlaanz.atlassian.net/browse/ACB-5748) |

| Story card | Landing Page : Clone Quote |
| --- | --- |
| JIRA |   |
| User Story | As anAsteron Adviser/Adviser staff, I want to be able to “Clone” a Quote |
| Pre-Conditions |  |
| PC01 |  Submitted Quote |
| Acceptance Criteria |  |
|  AC01 | **Given** I am logged in as an Adviser or Adviser Staff**When** an application has been submitted**Then** I should be able to select the option to **clone the quote** for the submitted application. |
| AC02 | **Given** AC01 is active**When** I click Clone Quote in the landing page**Then** I should be able to successfully clone the quote. |
| AC03 | **Given** AC02 is active**When** I click **Clone Quote** on the landing page**Then** a **new quote** should be displayed with all the following sections pre-populated from the submitted application: 1. **Personal Details** 2. **All covers and options selected** in the submitted application (both personal and business) 3. **Kids Cover** 4. **Premium and Frequency Details** 5. **Discounts** 6. **Commissions and Loadings** **And** I should be able to proceed by clicking Apply Now button |
| AC04  | **Given** AC03 is active**When** the client or even one client for multi life had a birthday before the **Clone Quote** action**Then** a **new quote** should be displayed with all the following sections **pre-populated** from the submitted application and **greyed out**: 1. **Personal Details** 2. **All covers and options selected** (personal and business) 3. **Kids Cover** 4. **Premium and Frequency Details** 5. **Discounts** 6. **Commissions and Loadings** **And** a message should appear at the top:*“The quote for this client is locked as the client has had a birthday. To create a current quote please return to the Quotes and Applications home page, open the client and select CREATE NEW.”* |
| **AC05** | **Given** a quote is successfully cloned (AC03) **When** I click Apply Now button**Then** only the information from quote-level should be used in the applicationand no further information from the prior quote/application should be used in the application (no answers from questions, Adviser Interview, Personal Interview), personal details, payment details etc.) |
|   |  |
|   |  |
|  |  |
| Business Rules | Clone quote functionality should work for all submitted applications whether it is single policy, multipolicy or multi life |
|  Exceptions/Limitations |   |
| Requirement Details / Technical Notes / Supporting Docs |   |
| Test Info |   |
