# Project Context

## What this project is

Automated extraction of business rules, field definitions, validation constraints,
and field dependencies from the Asteron Life Quote & Apply insurance form.
The form is built in OutSystems (React). Output feeds into Atlassian MCP for
Confluence/Jira documentation and OutSystems OutDoc for screen-level documentation
(OutDoc handles its own extraction — do not produce OutSystems-specific output).

## Target application

- **Login URL:** https://outsystems-dev.asteronlife.co.nz/CentralPortalsLogin/NewLoginRLANZ
- **Post-login destination:** Dashboard at `/AdviserCentral_Uplift/`
- **Form entry point:** Navigate to Quote & Apply → click "New Quote" (opens in new tab)
- **Form URL pattern:** `/QuoteAndApply/Quote?QuoteId=...`

## Interaction patterns and automation guide

All interaction patterns, element-type rules, section-by-section gotchas, and server.js
action reference are documented in:

  `.kiro/steering/form-automation-playbook.md`

Read that file before starting any automation session.

## Completed iterations

| Iteration | Date | Coverage | Folder |
|-----------|------|----------|--------|
| 001 | 2026-08-04 | Full form — Quote + Apply steps 2–6c (payment gate blocks 6d/6e) | `output/iteration-001/` |

QuoteId (iteration-001): `57d0a8ac-e396-4261-85de-4738503b2f0c`  
ApplicationId (iteration-001): `8103d198-8e5c-406a-882c-b3fd7061f775`

## Key DOM facts

- OutSystems DOM label mislabels on disability covers:
  - `Dropdown_WaitingPeriod3` = Waiting Period (DOM label says "Benefit Period")
  - `Dropdown2` within disability covers = Premium Structure (DOM label says "Monthly Benefit")
- Minimum premium: $240/year per life insured — increase Sum Insured if this error appears
- Accordion sections: check `aria-expanded` before clicking; true = already open, do not click again
