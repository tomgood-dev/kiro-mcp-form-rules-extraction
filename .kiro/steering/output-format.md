# Output Format

All form exploration sessions must produce output conforming to this schema.
Save to `output/form-spec.json` and `output/confluence-page.md`.

## JSON Schema

```json
{
  "meta": {
    "schema_version": "1.0",
    "form_name": "string — human readable name of the form or page",
    "source_url": "string — URL of the form page",
    "extracted_at": "string — ISO date"
  },
  "fields": [
    {
      "id": "string — DOM id or stable identifier",
      "label": "string — visible label text",
      "type": "text | email | date | number | radio | checkbox_multi | select | autocomplete_multi | file | textarea",
      "required": true,
      "defaultValue": "string or null",
      "options": ["array of strings for select/radio/checkbox, null otherwise"],
      "pattern": "string regex if observed, null otherwise",
      "minLength": "number or null",
      "maxLength": "number or null",
      "min": "number or null",
      "max": "number or null",
      "dependsOn": "string field id or null",
      "notes": "string — anything non-obvious about this field"
    }
  ],
  "dependencies": [
    {
      "id": "string — e.g. DEP-001",
      "type": "enable_on_value | populate_options | show_section | filter_options",
      "source": "string field id",
      "condition": "plain English description of the trigger condition",
      "target": "string field id or section name",
      "effect": "string — what happens to the target"
    }
  ],
  "validation_rules": [
    {
      "id": "string — e.g. VR-001",
      "field": "string field id",
      "rule": "string — plain English description",
      "mandatory": true,
      "errorMessage": "string — exact error text observed"
    }
  ],
  "business_rules": [
    {
      "id": "string — e.g. BR-001",
      "description": "string — plain English business rule",
      "fields": ["array of field ids this rule applies to"]
    }
  ],
  "lookup_data": {
    "key_describing_the_list": ["array of string values"]
  },
  "user_stories": [
    {
      "id": "string — e.g. US-001",
      "section": "string — form section this story covers",
      "summary": "string — As a [user], I want to [action] so that [outcome]",
      "acceptance_criteria": ["array of strings"]
    }
  ]
}
```

## Confluence Page Structure

Produce a markdown file (`output/confluence-page.md`) with this structure:

```
# [Form Name] — Business Requirements

> Source: [URL] | Extracted: [date] | Method: automated DOM analysis

## Fields

[Table: Field ID | Label | Type | Required | Constraints | Notes]

## Validation Rules

[Table: Rule ID | Field | Rule | Mandatory | Error Message]

## Business Rules

[Table: Rule ID | Description | Fields Affected]

## Field Dependencies

[Table: Dependency ID | Source Field | Condition | Target | Effect]

## Lookup Data

[One sub-section per lookup list, with bullet values]

## User Stories

[One sub-section per story, with acceptance criteria as a checklist]
```

## Jira User Stories

One story per logical form section. Format:

**Summary:** As a [user type], I want to [action] so that [outcome].

**Acceptance criteria:** bullet list of testable conditions.

Use the Atlassian MCP `create_issue` tool to create these in the configured project
after producing the JSON output.
