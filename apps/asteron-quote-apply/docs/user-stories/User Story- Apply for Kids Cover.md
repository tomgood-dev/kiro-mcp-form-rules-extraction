# User Story: Apply for Kids Cover



| **Author/s** | @Ravi Bellamkonda |
| --- | --- |
| **Contributor/s** | @Amanda-Rose Harlen |
| **Reviewer/s** | @Lewis Daniels |
| **Approvers** | @Amanda-Rose Harlen |
| **Status** |  |
| **Jira** | [\[ACB-2295\] Build - Apply for Kids Cover: Online Quoting Tool - AsteronConnect - Jira](https://rlaanz.atlassian.net/browse/ACB-2295) |

| Story card | Apply for Kids Cover |
| --- | --- |
| JIRA |   |
| User Story | As an Advisor/Advisor StaffI want to be able to apply for kids cover while I am creating a quote for a client So that I am able to add kids cover to the clients policy. |
| Pre-Conditions |  |
| PC01 | Advisor has been on-boarded (training completed, credentials provided to advisor) |
| PC02 |  |
| Acceptance Criteria |  |
|  AC01 | **Given** I am anAdviser or an Adviser staff **When** I am “creating a new quote” **Then** I should be provided the ability to also apply for ‘kids cover’ in the same quote |
|  AC02 | **Given **I am in the Kids Cover section**When **I am creating a new business quote/application**Then **I am able to select ‘kids cover’ **And **I must be able to enter the following details:a. Select Number of kidsb. For each kid I must be able to enter/select the following information - First Name  - Surname - Date of Birth  - Male or Female - Sum Insured amount |
|  AC03 | Given I am in the kids cover section of the New Business Quoting toolWhen I am selecting the Sum Insured amountThen a pre-populated drop-down list of the Sum Insured amount must be provided with default $50,000 (Free)And I must be able to select the Sum Insured amount. |
|  AC04 | The kids cover Sum Insured range is: - $50,000 (Free) - $60,000 - $70,000 - $80,000 - $90,000 - $100,000 - $110,000 - $120,000 - $130,000 - $140,000 - $150,000 - $160,000 - $170,000 - $180,000 - $190,000 - $200,000 |
|  AC05 | Given I am in the kids cover section of the New Business Quoting toolWhen I enter Date of BirthThen it should validate the date and age next birthday for kids is \>21And must through an error message “The maximum Age Next Birthday kids cover is 21”   Note: Even if there are multiple kids with ANB \> 21 only one error should be displayed under Kids Cover section. |
|  AC06 | Given I am in the kids cover section of the New Business Quoting toolWhen I select number of kids without any primary personal insurance coverThen an error message “Please add at least one Personal Insurance Cover before adding Kids Cover” should be displayed |
|  AC07 | Given I am on the Kids Cover section of the New Business Quoting Tool, When I update the number of kids, Then the system should dynamically display input fields for each child, allowing the user to enter the following details: - First Name - Surname - Date of Birth - Gender (Male/Female) - Sum Insured Amount |
| AC08 | **Given** I am on the **Kids Cover** section of the **New Business Quoting Tool**, **When** I select kid(s) sum insured more than 50000 **Then** the system should dynamically calculate premium and display |
| AC09 | **Given** I am on the **Kids Cover** section of the **New Business Quoting Tool**, **When** I select multiple kids with sum insured more than 50000 **Then** regardless of how many kids, premium panel should show only total premium for kids.For example a quote has Life cover with 3 kids cover with more than 50000 then in the progress pane it should showLife A - 100.10, Kids - 14.00,  Total - $114.10 |
| Business Rules | 1. Maximum number of kids is 9 per Life 2. No kids cover for business policies |
|  Exceptions/Limitations |   |
| Requirement Details / Technical Notes / Supporting Docs |   |
| Questions | - how does the Kids cover affect the overall premium amount for the client? |


**Current State Screenshots **
