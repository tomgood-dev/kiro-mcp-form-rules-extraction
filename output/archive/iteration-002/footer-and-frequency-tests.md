# Footer Buttons & Payment Frequency Tests

**Date:** 2026-08-12  
**Form state:** Age=35, Male, Occupation=AA (value 1), Employment=Employed (value 0), Life Cover A active (Lump Sum Covers 1), Sum Insured displayed as ".2.0.0.0.0.0." (calc-mask entry issue)  
**Premium:** Life Cover A, Monthly $21.18, Yearly $254.16

---

## TEST 1: Footer Buttons

### Footer Button Layout
The footer contains these buttons (all visible, `inFooter: true`):
- **Close**
- **View PDF**
- **Save as New**
- **Save**
- **Apply**

There are also hidden duplicate buttons (`inFooter: false`, `visible: false`) with IDs:
- `Button_SaveAsNew`
- `Button_Save`
- `Button_Apply`

---

### 1.1 Save Button

**Action:** `{action:'click', selector:'footer button:has-text("Save")'}`

**Result:** Opens a **modal dialog** (`role="dialog"`):
- Title/content: "Add Reference (Optional)"
- Input field: `id="Input_Reference"` (text, optional, initially empty)
- Buttons: **Cancel** | **Save**
- The form does NOT immediately save — it waits for the user to optionally add a reference and confirm.

**After clicking Save in the modal:**
- URL changes from `QuoteId=` (empty) → `QuoteId=684cf4cf-4a4c-49a2-9123-c28f0ef50254`
- URL also gains: `IsSaveEnabled=true`
- Page header now shows: "Last modified: 12/08/2026 10:52 AM"
- No error messages
- No toast/success notification detected in DOM
- The form reloads/re-renders (all dynamic IDs change)

**Business Rules Discovered:**
- Save always presents the "Add Reference" modal, even for first save
- Reference is optional (no validation if left blank)
- New quote: URL starts with `QuoteId=&ShowApplyNow=false&IsClone=false&LastModifiedDate=1900-01-01&ApplicationId=`
- After save: URL becomes `QuoteId=<guid>&ShowApplyNow=false&ApplicationId=&IsSaveEnabled=true`
- The `IsClone=false` parameter is removed after initial save

---

### 1.2 Save as New Button

**Action:** `{action:'click', selector:'footer button:has-text("Save as New")'}`

**Result:** Opens the **same "Add Reference (Optional)" modal** as Save:
- Same dialog structure: Cancel | Save buttons
- Input field: `id="Input_Reference"`

**Expected behavior (not fully confirmed due to modal still being open):**
- After confirming, should create a new quote with a new QuoteId
- The original quote remains unchanged

**Note:** The button `Save as New` is also available in the footer even BEFORE the first save (when `QuoteId=` is empty). However, the hidden button with `id="Button_SaveAsNew"` is always present.

---

### 1.3 View PDF

**Status:** Not tested directly in this session (the Save as New modal was still open). Based on button availability:
- Button is always visible in the footer
- It is NOT disabled even when premium is $0.00 or when the quote is unsaved
- Expected behavior: likely opens a new tab or triggers a download of the quote illustration PDF

---

### 1.4 Close Button

**Status:** Not tested directly in this session. Based on button availability:
- Button is always visible in the footer
- Expected behavior: navigates back to quote list (likely `https://outsystems-dev.asteronlife.co.nz/QuoteAndApply/`)
- May show a confirmation dialog if there are unsaved changes

---

## TEST 2: Payment Frequency Dropdown

### Dropdown Details
- **Element:** `<select>` with ID pattern `b25-l4-NNNN_0-l4-NNNN_0-PaymentFrequencyDropdown`
- **Label:** "Payment frequency"
- **Location:** Right-side premium panel (`.sidebar-fixed-scrollable`)
- **Default:** Monthly (value="1")
- **Options:**
  | Value | Text |
  |-------|------|
  | 0 | Fortnightly |
  | 1 | Monthly |
  | 2 | Quarterly |
  | 3 | Half Yearly |
  | 4 | Yearly |

### Important Note on ID Instability
The PaymentFrequencyDropdown ID prefix changes on EVERY re-render:
- First seen: `b25-l4-3714_0-l4-3561_0-PaymentFrequencyDropdown`
- After cover change: `b25-l4-4297_0-l4-3561_0-PaymentFrequencyDropdown`
- After another action: `b25-l4-6012_0-l4-5622_0-PaymentFrequencyDropdown`
- After Save: `b25-l4-8675_0-l4-8583_0-PaymentFrequencyDropdown`

**Stable locator:** `select[id*=PaymentFrequencyDropdown]` or `select[id$="PaymentFrequencyDropdown"]`

### Premium Display Format

The sidebar text changes dynamically based on the selected frequency:

**Monthly (default):**
```
Premium
Total Monthly Premium (All Lives)
$21.18
Life 1
Personal Insurance 1
Life Cover A
$21.18
Payment frequency
Fortnightly | Monthly | Quarterly | Half Yearly | Yearly
Total
$21.18
Total Yearly Premium
$254.16
Bundling Discounts
None
```

**Fortnightly:**
```
Premium
Total Fortnightly Premium (All Lives)
$9.77
Life 1
Personal Insurance 1
Life Cover A
$9.77
Payment frequency
Fortnightly | Monthly | Quarterly | Half Yearly | Yearly
Total
$9.77
Total Yearly Premium
$254.02
Bundling Discounts
None
```

### Frequency Conversion Calculations

| Frequency | Displayed Amount | Yearly Equivalent | Calculation |
|-----------|-----------------|-------------------|-------------|
| Monthly | $21.18 | $254.16 | $21.18 × 12 = $254.16 ✓ |
| Fortnightly | $9.77 | $254.02 | $9.77 × 26 = $254.02 ✓ |

**Conversion rule:** Fortnightly = Yearly ÷ 26, with rounding per payment.
- $254.16 ÷ 26 = $9.7754 → displayed as $9.77
- $9.77 × 26 = $254.02 (slight rounding difference from monthly-derived yearly of $254.16)

**Key observation:** The "Total Yearly Premium" differs slightly between Monthly ($254.16) and Fortnightly ($254.02) display modes. This is a rounding artifact — each frequency independently calculates its yearly total from its own rounded per-period amount.

### Frequency Interaction Method

The dropdown DOES respond to `dispatchEvent(new Event('change', {bubbles:true}))` when value is set directly via JavaScript. This bypasses the OutSystems Reactive event system but still updates the displayed premiums. However, using Playwright's `selectOption()` with the full ID would be the proper approach (the IDs just change every render).

---

## Additional Observations

### Cover that generated the premium
- The cover is "Life Cover A" (NOT Trauma as intended in setup)
- This appears because the calcmask entry created a malformed value ".2.0.0.0.0.0." which the system interpreted as a Life cover sum insured
- The Trauma cover was active but had sum insured showing as "." (empty/zero)

### Gender button behavior
- Clicking Male (button group) triggers a full re-render
- This removes all active covers (resets Lump Sum Covers to 0)
- Employment status also resets to "-1" (Select one)
- This is a major "reset" side-effect

### Minimum premium rule
- Error: "The minimum premium is $240.00 per year per Life insured"
- This appears when covers have $0 premium (no sum insured entered)
- Once a valid cover with premium ≥$240/year is active, the error clears

### The "Add Reference" save modal
- Always appears on Save and Save as New
- Has a single optional text input field
- Cancel closes without saving; Save proceeds with the save action
- The same modal structure is used for both Save and Save as New
