# User Story: Save Quote/Save As New



| **Author/s** | @Ravi Bellamkonda |
| --- | --- |
| **Contributor/s** | @Amanda-Rose Harlen |
| **Reviewer/s** | @Lewis Daniels |
| **Approvers** | @Amanda-Rose Harlen |
| **Status** |  |
| **Jira** | [\[ACB-2241\] Build - Save Quote/Save As New Quote: Online Quoting Tool - AsteronConnect - Jira](https://rlaanz.atlassian.net/browse/ACB-2241) |

| Story card | Save a Quote |
| --- | --- |
| JIRA |   |
| User Story | As an Advisor/Advisor StaffI want to be able to save a new business quote/applicationSo that I am able to provide my clients their life insurance quote |
| Pre-Conditions |  |
| PC01 | Advisor has been on-boarded (training completed, credentials provided to advisor) |
| PC02 | [User Story: Landing page: Online Quoting Tool](https://acendalife.atlassian.net/wiki/spaces/CFDDP/pages/1153761281/User+Story+Landing+page+Online+Quoting+Tool) |
| **Dependencies User Story: ** |  |
|  | [User Story: Create a New Business Quote](https://acendalife.atlassian.net/wiki/spaces/CFDDP/pages/1058472042/User+Story+Create+a+New+Business+Quote) |
| Acceptance Criteria |  |
|  AC01 | **Given** I am anAdviser or a Adviser staff **When** I have captured all the required information for a quote**Then** I should be able to ‘save’ OR ‘save as new’ the new business quote/application. |
| AC02 | Given I have selected 'save. When I have created a new business quote/applicationThen the reference popup should appear to enter add reference(30 character limit) with cancel and save buttons |
|  AC03 | Given AC02When  I have selected 'save. Then the new quote/application must be saved with reference (if it is entered)And a quote number must be created And the quote will have a status of ‘quote’And I should be able to see newly created quote in the Quotes and applications home pageAnd Control/Curser should be in the same quotes pageAnd 'save' button should be disabled unless if there are any more changes |
| AC04 | Given AC02When  I have selected ‘cancel’Then reference pop-up should be closed  And I should be redirected to quote screen |
| AC05  | Given I have created a new business quote/application When I click on ‘save as new’Then the reference popup should appear to enter add reference(30 character limit) with cancel and save buttons |
| AC06 | Given AC05 When I click on ‘save as new’Then I should be able to create more than one quote for client And rename the quote based on my preference referenceAnd I should be able to see newly created quote in the Quotes and applications home pageAnd Control/Curser should be in the same pageAnd 'save as new' button should be disabled unless if there are any more changes |
| AC07 | Given AC05When  I have selected ‘cancel’Then reference pop-up should be closed And I should be redirected to quote screen |
|  AC08 | Given I have selected saved quote. When I have updated the details in the same quote and click saveThen the quote/application must be saved with the same quote name And I should be able to see updated quote in the Quotes and applications home page |
| AC09  | Given I have entered any of the data in the quote screenWhen I click close buttonThen a pop should appear with a message “Would you like to save the quote before exiting?” with “Cancel”, “Save” and “Don’t Save” buttons |
| AC10 | Given AC09When I have selected ‘cancel’Then I should be redirected to quote screen |
| AC11 | Given AC09When I have selected ‘Don’t Save’Then I should be redirected to landing page without saving the quote |
| AC12 | Given AC09When I have selected ‘Save’Then if minimum details (ANB, Gender and Smoker) are not entered display an error message “Enter minimum details to save quote” |
| AC13 | Given AC09When I have selected ‘Save’Then quote should be saved, and I should be redirected to landing page with newly added quote displayed in the in-progress table if all minimum details are entered |
| Business Rules | - The ‘save as new’ capability allows the adviser to create multiple quote variations for the same client depending on their client risk, product preference and premium appetite. |
|  Exceptions/Limitations | - The ‘save as new’ reference name currently has a 30-character limit in AsteronConnect. |
| Requirement Details / Technical Notes / Supporting Docs | - The new business quote/application tool must allow a automatic save feature so that all captured data is not lost in any part of the process |
| Test Info |   |

**List of statuses **

| **Status** | **Stage** | **Pdf** |
| --- | --- | --- |
| Quote | The adviser is able to enter customer details and generate a live quote on screen (eg customer name, DOB, sum insured, type of cover, premium structure etc). | It is not saved as a PDF copy in AsteronConnects landing page for later access. Advisers can save them to local drive. |
| Pre-application | The adviser has done the Quote, Personal Details and Duty of Disclosure, but not the Personal Statement. | It is not saved as a PDF copy in AsteronConnects landing page for later access. Advisers can save them to local drive. |
| Application in progress | Same as Pre-Application except they have also started/done the Personal Statement. | It is not saved as a PDF copy in AsteronConnects landing page for later access. Advisers can save them to local drive. |
| Application in progress – with Teleinterview (TIV) | Same as Pre-Application plus the adviser has handed off to TeleInterview for Asteron staff to call the customer and complete the Personal Statement over the phone. | It is not saved as a PDF copy in AsteronConnects landing page for later access. Advisers can save them to local drive. |
| Submitted | The adviser (or teleinterviewer) has completed and submitted the application. | PDFs are generated and are available to adviser on AsteronConnect landing page. |
| Expired | Applications with a status of **Pre-Application** or **Application in Progress (including with TIV)** that do not progress to **Submitted **from the date of “last modified”, expire after 45 days. | No PDF |



**Current State Screenshots**
