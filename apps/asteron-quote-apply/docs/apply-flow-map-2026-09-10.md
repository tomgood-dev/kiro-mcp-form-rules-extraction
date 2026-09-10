# Apply-flow drive — progress notes 2026-09-10

## EFFICIENCY BREAKTHROUGH: reopen an in-progress application by ApplicationId (no rebuild!)
- Driving quote -> Adviser Use -> Apply -> Client Summary -> Proceed mints a real **ApplicationId**
  (seen in URL e.g. `DutyOfDisclosure?ApplicationId=19b20832-59fb-4e5a-bfae-8439898d1837`).
- **`page.goto('/QuoteAndApply/<Screen>?ApplicationId=<id>')` RESUMES the application** (cold, fresh
  session, ~1.5 min — NO quote rebuild). Confirmed working for DutyOfDisclosure.
- The app **redirects direct nav to the earliest INCOMPLETE step** (documented behaviour): navigating
  `PersonalDetails?ApplicationId=<id>` bounced to `DutyOfDisclosure` because DoD isn't complete yet.
- `Client?...` and `InsuranceHistory?...` gave 404 → those exact screen route names are wrong; discover
  real route names as we progress (only DutyOfDisclosure confirmed so far; PersonalDetails is a valid
  route once reached — it rendered when driven to, just redirects when its predecessor is incomplete).
- **Reusable seed application (account D / tom.good+3 / state-qa-d.json):**
  `ApplicationId=d61200f7-8d33-4940-ba90-dfa87952c0b9` currently parked at **Personal Details** (DoD done).
  Reopen: `page.goto('/QuoteAndApply/PersonalDetails?ApplicationId=d61200f7-8d33-4940-ba90-dfa87952c0b9')`.
  (May expire/change; re-mint via reachApplicationFlow + proceedThroughClientSummary + DoD-Yes if it 404s/redirects to quote.)

## Flow mapped so far (account D)
1. Quote screen -> (helpers: completePersonalDetailsForApply incl income + activateCover + SI + fillAdviserUse('Upfront') + Apply) -> **Client Summary**
2. **Client Summary** (`Quote?...`): own mandatory First/Last Name (real fill()) -> **Proceed to application** -> DoD
3. **Duty of Disclosure** (`DutyOfDisclosure?ApplicationId=`): narrative + an **adviser-confirmation
   Yes/No** button-group. CONFIRMED 2026-09-10: on account D there is NO separate terms checkbox
   (checkboxes:[]) — the ONLY mandatory control is the Yes/No confirmation. Set **Yes** (real mouse
   click) then click the footer **Next** (real mouse click on its box) -> advances to Personal Details.
   (Earlier "couldn't pass DoD" was the Next button not being clicked via a real mouse gesture, now fixed.)
4. **Personal Details** (`PersonalDetails?...`): mandatory = Title, Marital Status, **Height (Cm) OR imperial
   — fill only ONE unit; filling BOTH Cm AND Feet/Inches invalidates it**, **Weight (Kg) only**, Mobile
   Number, Email, Address (type-ahead), + paramedical/terms per on-screen errors.
5. (next) Insurance History / Occupation / Financial / Tele-Interview -> Personal Statement -> Underwriting/Owner/Payment/Submit (per apply-flow/page.md). Payment likely the real wall — TBC.

## KEY LESSONS (applied)
- READ the on-screen validation/error text after each Next; it names exactly what's missing (agreement/terms, a field).
- Real Playwright fill()/selectOption + real mouse clicks for footer buttons; not evaluate/element.click, not raw .value.
- Height/Weight: ONE unit system only.
- Reopen-by-ApplicationId to iterate on a deep screen without rebuilding — the efficient loop.

## NEXT
Reopen at DoD by ApplicationId, satisfy BOTH the adviser confirmation AND the agree-to-terms control
(read the error to find it), advance to Personal Details, fill its full set (one height/weight unit),
continue screen-by-screen capturing each screen's mandatory fields, to the end/wall. Then generate the
deferred apply-flow user-story specs from this map.
