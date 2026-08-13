# Insurance, Financial & Tele Interview

> Child of [Apply Flow](../page.md). Rule ID prefix: `IFT-`. See the [confidence note](../page.md) on this section.

Step 4 is four sequential sub-pages, each with Previous/Next footer navigation.

## Insurance History

| Rule ID | # | Question | Type |
|---|---|---|---|
| `IFT-01` | 1 | Have you ever had or applied for any insurance cover with Asteron Life or AA Life? | Radio Yes/No |
| `IFT-02` | 2 | Other than this application, do you currently have, or are you currently applying for, any Life or Accidental Death benefit insurance? | Radio Yes/No |

| Rule ID | Rule |
|---|---|
| `IFT-03` | If **Yes** to question 2, conditional fields appear: provider name, cover type, benefit amount. |

## Occupation Details

| Rule ID | # | Question | Type |
|---|---|---|---|
| `IFT-04` | 1 | As part of your job, are you involved in any of the following? | Radio Yes/No |

| Rule ID | Rule |
|---|---|
| `IFT-05` | If **Yes**, conditional checkboxes appear: Working underground in a mine or tunnel; Working at heights in excess of 10 metres; Working offshore/at sea/underwater; Working with dangerous substances or chemicals; Working with weapons or explosives; Other hazardous duties (this last one requires free-text detail). |

## Financial Details

| Rule ID | Field | Type | Required |
|---|---|---|---|
| `IFT-06` | Annual earned income | Masked currency input | **Yes** |

| Rule ID | Rule |
|---|---|
| `IFT-07` | This value feeds underwriting income-replacement calculations and **may differ** from the Pre-tax Annual Income entered on the Quote screen — they are not automatically the same figure and both should be checked for consistency in test scenarios. |

## Tele Interview

| Rule ID | Field | Type | Notes |
|---|---|---|---|
| `IFT-08` | Would you like to use our tele-interview service? | Button group (Yes/No) | If **Yes**, a scheduling interface/contact details are provided so the insured completes their Personal Statement by phone instead of online. |
