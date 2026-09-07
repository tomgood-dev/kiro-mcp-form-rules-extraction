# User Story: Saved Quote/Application Navigation



| **Author/s** | @Ravi Bellamkonda |
| --- | --- |
| **Contributor/s** | @Amanda-Rose Harlen |
| **Reviewer/s** | @Lewis Daniels |
| **Approvers** | @Amanda-Rose Harlen |
| **Status** |  |
| **Jira** |  |

| Story card | Save a Quote |
| --- | --- |
| JIRA |   |
| User Story | As an Advisor/Advisor StaffI want to be able to save a new business quote/applicationSo that I am able to retrieve my clients their life insurance quote |
| Pre-Conditions |  |
| PC01 | Advisor has been on-boarded (training completed, credentials provided to advisor) |
| PC02 | [User Story: Landing page: Online Quoting Tool](https://acendalife.atlassian.net/wiki/spaces/CFDDP/pages/1153761281/User+Story+Landing+page+Online+Quoting+Tool) |
| **Dependencies User Story: ** |  |
|  | [User Story: Create a New Business Quote](https://acendalife.atlassian.net/wiki/spaces/CFDDP/pages/1058472042/User+Story+Create+a+New+Business+Quote) |
| Acceptance Criteria |  |
|  AC01 | **Given** I am anAdviser or a Adviser staff **When** I have captured all the required information for a quote(ANB,Gender, Smoker)**Then** I should be able to ‘save’ OR ‘save as new’ the new business quote/application. |
|  AC02 | Given AC01When I have selected 'saveThen Reference pop up should appear to add 30-character reference(optional)And I should be able see action buttons Save or Cancel |
|  AC03 | Given AC02When I click on save with or without entering referenceThen Quote should be saved with status “Quote”And I should be able to see newly created quote in the Quotes and applications home page |
|  AC04 | Given AC02When I click on cancel Then I should be redirected to quote page without saving |
| AC05 | Given AC01When I have selected ‘Save as new’ Then Reference pop up should appear to add 30-character reference(optional)And I should be able see action buttons Save or Cancel |
| AC06 | Given AC05When I click on save with or without entering referenceThen New Quote should be saved with status “Quote”And I should be able to see newly created quote in the Quotes and applications home page And any further updates/modifications should be saved onto new quote |
| AC07 | Given AC05When I click on cancel Then I should be redirected to quote page without saving |
|  AC08 | Given I have a saved quote with the status “Quote”When I click on saved quoteThen I should be directed to the quote page where it was saved last time with all prepopulated details |
|  AC09 | Given I have a saved quote with the status “Pre-Application”  When I click on saved quoteThen I should be directed to the client summary page |
|  AC10 | Given I have a saved application with the status “Application In Progress” When I click on saved quoteThen I should be directed to the Duty of Disclosure page |
|  AC11 | Given I have a saved quote with the status “Quote” or “Pre Application”When I click on saved quote after client has had a birthdayThen a pop with message “The client has had a birthday since this quote was prepared and as such the premium quoted is no longer valid. Please select either VIEW QUOTE and the original date and premium quoted will not change. Or you can CREATE NEW with an updated ANB and a new quote will be created with the updated premium, age details and today's date.” should be displayed as shown in the screen shot with buttons 1. Close - to be redirected to landing page upon clicking 2. View Quote  3. Create New with updated ANB |
|  AC12 | Given AC11When I click on View QuoteThen a **new quote **should be displayed with all the following sections **pre-populated** from old quote and **greyed out **as shown in the screenshot: 1. **Personal Details** 2. **All covers and options selected** (personal and business) 3. **Kids Cover** 4. **Premium and Frequency Details** 5. **Discounts** 6. **Commissions and Loadings** **And** a message should appear at the top:*“The quote for this client is locked as the client has had a birthday. To create a current quote please return to the Quotes and Applications home page, open the client and select CREATE NEW.”*Status :QuoteStatus :Pre Application |
|  AC13 | Given AC11When I click on Create New with updated ANBThen a **new quote **should be displayed with all the following sections **pre-populated** from the old quote with new ANB and new premiums 1. **Personal Details** 2. **All covers and options selected** (personal and business) 3. **Kids Cover** 4. **Frequency Details** 5. **Discounts** 6. **Commissions and Loadings** |
|  AC14 | Given I have a saved quote with the status “Application in Progress”When I click on saved quote after client has had a birthdayThen a pop with message “The Age Next Birthday of the client does not match with the Date of Birth provided. You will need to update the quote for this application.” should be displayed as shown in the screen shot with buttons 1. Close - to be redirected to landing page upon clicking 2. Edit Quote |
| AC15 | Given AC14When I click Edit Quote buttonThen a **new quote **should be displayed with all the following sections **pre-populated** from the old quote with new ANB and new premiums 1. **Personal Details** 2. **All covers and options selected** (personal and business) 3. **Kids Cover** 4. **Frequency Details** 5. **Discounts** 6. **Commissions and Loadings** And need to retain all data entered in the application earlier |
| Business Rules |  |
|  Exceptions/Limitations |  |
| Requirement Details / Technical Notes / Supporting Docs |  |
| Test Info |   |
