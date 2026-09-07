# User Story: Landing Page: In Progress Quotes Table



| **Author/s** | @Ravi Bellamkonda |
| --- | --- |
| **Contributor/s** | @Amanda-Rose Harlen |
| **Reviewer/s** | @Lewis Daniels |
| **Approvers** | @Amanda-Rose Harlen |
| **Status** |  |
| **Jira** | [\[ACB-3570\] Build - Landing page: In progress Quotes - AsteronConnect - Jira](https://rlaanz.atlassian.net/browse/ACB-3570) |

| Story card | In Progress Quotes |
| --- | --- |
| JIRA |   |
| User Story | As anAsteron Adviser/Adviser staffI want to be able to view and manage existing quotes So that I can proceed or view quotes |
| Pre-Conditions |  |
| PC01 |  Advisor has been onboarded and advisor has their credentials to log into the portal and generate a new business quote. |
| PC02 | Advisor has successfully logged into adviser portal and navigated to New Business Quoting Tool[User Story: Generate Quote PDF (view only)](https://acendalife.atlassian.net/wiki/spaces/CFDDP/pages/1151107073/User+Story+Generate+Quote+PDF+view+only) |
| **Dependencies User Stories ** |  |
| Acceptance Criteria |  |
|  AC01 | **Given** I am an Adviser/Adviser staff**When** I have logged into adviser portal and navigated to quote and apply**Then** I should be presented with a UI screen with In Progress Quotes table where I can perform the following functions: - I should be able to search for quote by      - a customer name     - last modified date     - status     - adviser number/code or name     - reference - I should be able to search for an existing quote for a specific customer and view the quote - I should be able to create a new quote  - I should be able to select number of entries (10, 20, 50, 100) to be shown on the screen.  - I should be search and view all quotes I created - I should be able to download submitted quote/application pdfs |
|  AC02 | **Given** I am an Adviser/Adviser staff**When** I enter my **adviser number ****And **click on **search ****Then** I should be able to: - view all quotes for my clients  - quote should show from most recent at the top (last modified) - view quotes that are ‘quotes' and also applications that are ‘pre application’ ‘submitted’ ‘application in progress with TIV' ‘application in progress’, ‘submitted’ and 'cloned’ - view expired application records in the table |
| AC03 | **Given** I am an Adviser/Adviser staff**When** I am in the landing page**Then **I should be able to select my agency (one adviser can be associated with multiple agencies)**And ** click create quote |
| AC04 | **Given** I am in the New Business Quote Tool UI **When** I click refresh content**Then **I should be able to see latest table with all the quotes, most recently modified should show at the top |
| AC05 | **Given** I am in the New Business Quote Tool UI **When** I select checkbox for quotes with “Quote” status**Then **I should be able delete selected quotes from my landing page |
| AC06 | **Given** I select checkbox for quotes(one or more) with “Quote” status **When** I click delete icon**Then **I should be able see popup with message “Are you sure you want to delete X lives ? Deleted lives cannot be recovered”  with cancel and delete buttonsNote: This number should be dynamic. If user select 5 quotes which has 6 lives and click delete then message should have 6 lives. |
| AC07 | **Given **AC06**When** I click delete button**Then **that quote should be deleted and table should be refreshed immediately |
| AC08 | **Given **AC06**When** I click cancel button**Then **I should be redirected to the landing page with checkbox ticked |
| AC09 | **Given** I am in the New Business Quote Tool UI **When** I select number of entries to display in the in progress table**Then **I should be see those number of entries in the table**And **I should be able to see remaining entries in the different pages**And **I should be able to navigate to any of those pages |
| AC10 | **Given** I am in the Landing page of **New Business Quote Tool UI****When** I click on any quote with the status **“Quote”****Then** the system should open the selected quote on the **Quote Page **with the details prepopulated |
| AC11 | **Given** I am in the Landing page of **New Business Quote Tool UI****When** I click on any quote with the status **“Pre Application”****Then** the system should open the selected record from client summary page with prepopulated details |
| AC12 | **Given** I am in the Landing page of **New Business Quote Tool UI****When** I click on any application with the status **“Application In Progress”****Then** the system should open the selected record from Duty of Disclosure page with prepopulated details |
| AC13 | **Given** I am in the Landing page of **New Business Quote Tool UI****When** I click on any application with the status **“Application In Progress - with Teleinterview”****Then** the system should open the selected record from Duty of Disclosure page with prepopulated details |
| AC14 | **Given**the user is on the **Landing Page** of the **New Business Quote Tool UI**, **When** there are **multiple lives** included in the application or quote, **Then** the system should: 1. Allow the user to **expand** record to view individual quotes or applications. 2. Allow the user to **collapse** record to hide details and streamline the view. 3. Display the **status of the main record** as the **highest progressed status** among all quotes or applications. 4. Display **all Life Insured names** in the main record. 5. Enable the user to **search** using **any Life Insured's name**. 6. **Prevent the user** from adding any **Reference**. |
| AC15 | **Given** AC14 is active, **When** the user expands a record in the table where **multiple lives** are included in the application or quote, **Then** the system should: 1. **Display all individual records** associated with that quote or application. 2. **Show the status** for each individual record. 3. **Provide a checkbox** to **delete** records **only if the status is "Quote"**. 4. **Allow the user** to **add or update a reference** for each individual record. |
| AC16 | **Given** AC15 is active, **When** the user **collapses** the main record in the table where **multiple lives** are included in the application or quote, **Then** the system should: 1. **Display the main record** associated with that quote or application. 2. **Show the status** of the main record as the **highest progressed status** among all quotes or applications. 3. **Display all Life Insured names** in the main record. 4. **Enable search functionality** using **any Life Insured's name**. 5. **Prevent the user** from **adding any Reference**. |
| AC17 | **Given** the user is on the **Landing Page** of the **New Business Quote Tool UI**, **When** the **status is "Submitted"** and the user clicks on the **three-dots menu**, **Then** the system should: 1. **If the status is "Quote"**, display the following options:     - **Edit**     - **Delete** 2. **If the status is "Submitted"**, display the following options:     - **Download Application**     - **Download Client Application**     - **Download Confirmation**     - **Download Declaration**     - **Download Quote**     - **Clone Quote** 3. **For all other statuses**, display:     - **Edit** |
| AC18 | **Given** the user is working on the new quote or opened a saved quote **When** the user return to the landing page and open further quotes or click create quote **Then** the system should display below popup |
| AC19 | **Given** AC18 is active **When** the user clicks the buttons in the pop-up   **Then** the following actions occur based on the user’s selection: 1. **Proceed**     - Navigates the user to:         - A **new quote**, **or**         - The **saved existing quote/application**, depending on the workflow. 2. **Cancel**     - Keeps the user in the **current quote/application** without making any changes. |
| Business Rules |  |
|  Exceptions/Limitations |   |
| Requirement Details / Technical Notes / Supporting Docs |   |
| Test Info |   |
| FIGMA Design | [Asteron Connect – Figma](https://www.figma.com/design/pRFVGjAz7tRES2x3ZuOaI4/Asteron-Connect?node-id=1-20&p=f&t=KVZ1p6V9OVeuIMPz-0) |

**Questions & things to clarify **

1. AsteronConnect have a Calculator in the backend, this is used for employment and annual income (refer to workshop video for this) need to understand where this calculator is saved and how it works. 
2. The Occupation list, this needs to be stored somewhere - need to determine where this will be stored.

**Current State Screenshots:**
