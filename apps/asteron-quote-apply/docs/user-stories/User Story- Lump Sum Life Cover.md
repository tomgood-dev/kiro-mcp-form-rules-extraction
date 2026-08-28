# User Story: Lump Sum Life Cover



| **Author/s** | @Ravi Bellamkonda |
| --- | --- |
| **Contributor/s** | @Amanda-Rose Harlen |
| **Reviewer/s** | @Lewis Daniels |
| **Approvers** | @Amanda-Rose Harlen |
| **Status** |  |
| **Jira** | [\[ACB-2242\] Build - Lump Sum Life Cover and Additional Covers: Online Quoting Tool - AsteronConnect - Jira](https://rlaanz.atlassian.net/browse/ACB-2242) |

| Story card | Apply for Lump Sum Cover for personal policy |  |
| --- | --- | --- |
| JIRA |   |  |
| User Story | As an Advisor/Advisor StaffI want to be able to apply for lump sum cover while I am creating a quote for a client So that I am able to add various lumpsum covers to the clients policy. |  |
| Pre-Conditions |  |  |
| PC01 | Advisor has been on-boarded (training completed, credentials provided to advisor) |  |
| PC02 |  |  |
| Acceptance Criteria |  |  |
|  AC01 | Given I am an Adviser or an Adviser staff When I am “creating a new quote” Then I should be provided the ability to apply for ‘lumpsum cover’ in the quote |  |
|  AC02 | Given I am in the Lump Sum Cover sectionWhen I am creating a new business quote/application for Personal insuranceThen I am able to see below lump sum covers - Life |  |
|  AC03 | Given I am in the lump sum cover section of the New Business Quoting toolWhen I select LifeThen  I must be provided the ability to enter the Sum Insured amount(only digits)And “Inflation adjustment” should be auto-tickedAnd based on the cover type selected the premium structure dropdown must be pre-populated list and must be defaulted to Stepped |  |
| AC04 | Given AC03When I change the frequency Then premium should be re-calculated and displayed in the Details section on the right side the screenAnd Total premium for all lives should be displayed in the Premium section |  |
|  AC05 | Given AC04When I enter Sum Insured amountThen premium should be calculated and displayed in the Details section on the right side the screenAnd Total premium for all lives should be displayed in the Premium section |  |
| AC06 | Given I am in quote screenWhen I have selected the cover typeThen I must be provided the option to ‘add’ or ‘remove’ the cover typeAnd I must be able to view the changes to the premiums on the details section on the right hand side of the screen ” |  |
| AC07 | Given I enter SI and select “Stepped” as premium structureWhen age next birthday of the life insured is not in between 11 and 75  and I click applyThen an error message “Age Next Birthday must be between 11 and 75” should be displayed |  |
| AC08 | Given I enter SI and select “Level to 50” as premium structureWhen age of the life insured is not in between 17 and 45 and I click applyThen an error message “Maximum Age Next Birthday for level to 50 “Life Cover” is 45 should be displayed |  |
| AC09 | Given I enter SI and select “Level to 60” as premium structureWhen age of the life insured is not in between 17 and 55 and I click applyThen an error message “Maximum Age Next Birthday for level to 60“Life Cover” is 55 should be displayed |  |
| AC10 | Given I enter SI and select “Level to 65” as premium structureWhen age next birthday of the life insured is not in between 17 and 60 and I click applyThen an error message “Maximum Age Next Birthday for level to 65 “Life Cover” is 60 should be displayed |  |
| AC11 | Given I enter SI and select “Level to 70” as premium structureWhen age next birthday of the life insured is not in between 17 and 65 and I click applyThen an error message “Maximum Age Next Birthday for level to 70 “Life Cover” is 65 should be displayed |  |
| AC12 | Given I enter SI and select “Level to 75” as premium structureWhen age next birthday of the life insured is not in between 17 and 70 and I click applyThen an error message “Maximum Age Next Birthday for level to 75 “Life Cover” is 70 should be displayed |  |
| AC13 | Given I enter SI and select “Level to 80” as premium structureWhen age next birthday of the life insured is not in between 17 and 70 and I click applyThen an error message “Maximum Age Next Birthday for level to 80 “Life Cover” is 70 should be displayed |  |
| AC14 | Given I enter SI and select “Level to 100” as premium structureWhen age next birthday of the life insured is not in between 17 and 75 and I click applyThen an error message “Maximum Age Next Birthday for level to 100 “Life Cover” is 75 should be displayed |  |
| AC15 | Given I enter SI and select any Level as premium structureWhen age next birthday is less than 17 and I click applyThen an error message “Minimum Age Next Birthday for level “Life Cover” is 17 should be displayed |  |
| AC16 | Given I enter SI and select “Stepped” as premium structureWhen SI is more than 50,000 and age next birthday is between 11 to 16Then an error message “The Maximum “Life Cover” sum insurable for clients under Age Next Birthday 17 is $50,000 should be displayed |  |
| AC17 | Given I enter SI and select any level or stepped as premium structureWhen combined SI of all policies per life is more than 250000and age next birthday is between 17 to 21and (income is zero and any occupation) or (unemployed and no income)Then an error message “The maximum total Sum Insured per life for Life Cover clients with an Age Next Birthday 17 - 21, not earning any income is $250,000” should be displayed |  |
| AC18 | Given for a life insured who is part time worker I enter SI and select any level or stepped as premium structureWhen combined SI of all policies per life is more than 500000 and age next birthday is between 17 to 21and occupation is part timeThen an error message “The total Life Cover Sum Insured for clients with an Age Next Birthday 17 - 21 and earning an income through part time work, is subject to underwriting (individual consideration up to a maximum of $500,000 - please contact your underwriter)”  should be displayed |  |
| AC19 | Given I enter all the details for a life coverWhen calculated yearly premium is less than 240.00 and I click applyThen an error message “The minimum premium is $240.00 per year per life insured” should be displayed |  |
| AC20 | Given I enter all the details for a life coverWhen age next birthday is more than 65 and select anything other than “None” in the we pay your premiums drop down  Then an error message “The maximum Age Next Birthday for We Pay Your Premiums is 65” should be displayed |  |
| AC21 | Given I want to apply lumpsum LifecoverWhen I choose premium freeze (by selecting checkbox)Then automatically inflation adjustment benefit checkbox should be unchecked as only one of them should be selected always |  |
| AC22 | Given I want to apply lumpsum Life coverWhen I select flexi rate other than N/A Then automatically premium should be reduced the by percentage selected in the flexi rate |  |
| AC23 | Given I want to apply for Life coverWhen I click Life buttonThen I must be able to enter SI for Life coverand I must be able to select maximum 3 Life covers |  |
|  | Given I am in get quote screen When selected 3 life covers Then Life button should be disabled as maximum 3 life covers can be applied |  |
|  |  |  |
| Business Rules |  |  |
|  Exceptions/Limitations |   |  |
| Requirement Details / Technical Notes / Supporting Docs |   |  |
| Figma Design | [Asteron Connect – Figma](https://www.figma.com/design/pRFVGjAz7tRES2x3ZuOaI4/Asteron-Connect?node-id=94-2069&t=KVZ1p6V9OVeuIMPz-0) |  |
| Questions | - |  |


**Screenshots from Current State:**
