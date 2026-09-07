# User Story: Early Trauma Benefit

| **Author/s** | @Ravi Bellamkonda |
| --- | --- |
| **Contributor/s** | @Amanda-Rose Harlen |
| **Reviewer/s** | @Lewis Daniels |
| **Approvers** | @Amanda-Rose Harlen |
| **Status** |  |
| **Jira** | [\[ACB-10105\] Build - Early Trauma Benefit: Online Quoting Tool - AsteronConnect - Jira](https://rlaanz.atlassian.net/browse/ACB-10105) |

| Story card | Early Trauma Benefit on Personal and Business Policies |
| --- | --- |
| JIRA |   |
| User Story | As anAsteron Adviser/Adviser staff/TIV, I want to calculate correct Early Trauma SIs So that I can progress towards submitting my application. |
| Pre-Conditions |  |
| PC01 | Quote/Application with Trauma cover (Standalone or Acc) |
| Acceptance Criteria |  |
|  AC00 | **Given** I am on the **Quote Page** **When**  - I add Early Trauma Benefit option to a Standalone Trauma or Accelerated Trauma benefit, or - I remove an Early Trauma Benefit option, or - I amend the Trauma Recovery Sum Insured on a benefit that has Early Trauma Benefit Option **Then **Early Trauma SI for each benefit on the policy should be calculated using business rules |
|  AC01 | **Given** AC00 is active **When** Trauma SI is less or equal to 10K **Then **Early Trauma Benefit SI should be equal to Trauma SI |
|  AC02 | **Given** AC00 is active **When** Trauma SI is less or equal to 10K **Then **Early Trauma Benefit SI should be equal to Trauma SI |
| AC03 | **Given** AC00 is active**When** Trauma SI is \> 10K and \<=50K**Then **Early Trauma Benefit SI should be equal to 10K |
| AC04 | **Given** AC00 is active**When** Trauma SI is \> 50K  **Then **Early Trauma Benefit SI should be 20% of Trauma SI with maximum of 100K |
| AC05 | **Given** AC00 is active**When** Early Trauma Benefits are calculated according to business rules  **Then ** - I should be able to see correct SI for Early Trauma Benefits in the PDFs. - Correct SIs should be sent to L400 |
| **Business Rules** | **For any given policy,** the business rules are: - The **Total** **Early Trauma** benefit sum insured is 20% of the **Total Trauma Recovery** benefit sum insured (**Trauma Recovery** benefits ***which do not have*** **Early Trauma Benefit** rider selected are not included in the above calculation)     - with a maximum of $100,000     - with a minimum of the lesser of:         - $10,000         - The total Trauma Recovery Sum Insured - Both **Standalone and Accelerated Trauma Recovery** benefit sums insured are aggregated together to apply the above rules - All Early Trauma Benefit sums insured on a policy ***must be the same % ***of its associated Trauma Recovery Benefit Sum Insured.  So , in Asteron Connect, every time an Early Trauma benefit is added/removed, or a Trauma Recovery Sum Insured is altered, the Early Trauma Sum Insured needs to be re-calculated for all instances on the policySee example below  |
|  Exceptions/Limitations |   |
| Requirement Details / Technical Notes / Supporting Docs |   |
| Test Info |   |

?
