# Kiro MCP — Form Rules Extraction

## Overview

Explore the Asteron Life Quote & Apply form using Playwright MCP. The goal is to
discover every field, validation rule, field dependency, and lookup dataset on the
form — without being told what to look for — and produce a structured specification
document ready for Atlassian MCP ingestion.

## Requirements

### 1. Authentication

**User story:** As an analyst, I need to authenticate so I can access the Quote form.

**Acceptance criteria:**
- Navigate to the login page and complete the login flow
- Confirm the dashboard has loaded before proceeding
- Open a new quote from the dashboard

### 2. Full Form Exploration

**User story:** As an analyst, I need every field on every page of the form to be
discovered and characterised without being told what to look for.

**Acceptance criteria:**
- Scroll to the bottom of the page before reading state — some sections lazy-load
- Submit the form empty first to surface which fields are required (red borders = mandatory)
- Fill every visible text/select/radio/checkbox input with valid test data
- Click every non-navigation button on the page (covers, add-ons, toggles, modals)
- After each button click: re-read the page state and fill any newly revealed fields
- For accordion sections: only click to open if `aria-expanded` is not already `"true"`
- For React Select dropdowns: type a character to open the option list, then click the option — do not use native `selectOption`
- Repeat the fill → click → re-fill cycle until no new fields or errors appear
- If the page navigates to a new step, record all fields from the previous step first
- Continue across all pages until the form is fully submitted or reaches a summary/confirmation screen

### 3. Validation & Dependency Mapping

**User story:** As an analyst, I need all validation rules and field dependencies captured so developers know the business logic without reverse-engineering the UI.

**Acceptance criteria:**
- Record which fields are required vs optional (from the empty-submit pass)
- For each field, record: type, label, allowed values, min/max length, regex pattern if visible
- For each error message observed after submit or invalid input, record the exact text and which field triggered it
- Record every dependency: if field B becomes enabled/visible/populated as a result of a change in field A, that is a dependency (format: source → effect → target)
- Record all lookup data: every option list for every dropdown or radio group

### 4. Structured Output

**User story:** As an analyst, I need the output in a structured format that Atlassian MCP can ingest directly.

**Acceptance criteria:**
- Produce a JSON block conforming to the output schema in `steering/output-format.md`
- Produce a Confluence page structure (section headers, table of fields, table of rules)
- Produce Jira user stories (one per logical form section) with acceptance criteria
- Save the JSON output to `output/form-spec.json`
- Save the Confluence markdown to `output/confluence-page.md`
