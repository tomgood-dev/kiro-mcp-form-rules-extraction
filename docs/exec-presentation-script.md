# Presentation Script — Exec & Project Owner

**Audience:** My exec team + Lewis (project owner).
**Format:** Talking points, not a speech. Paired with slides/screenshots (presenting from
materials, not live). ~10-12 min.

> 🎙️ = talking point (say in my own words)
> 🖼️ = slide / material to show

---

## 1. The challenge

🖼️ *Quote & Apply app screenshot*

🎙️ Quote & Apply is a large, business-critical form with a lot of logic baked in. When I picked
it up there were three real problems:
- **No automated tests** — nothing catching a break before it reached QA or production.
- **No documented business rules** — the logic lived only in the app and in people's heads.
- **User-story quality gaps** — requirements were changing and ambiguous, hard to test against.

🎙️ So we couldn't reliably answer a simple question: *"if we change something, did we break a rule?"*

---

## 2. What we built

🖼️ *Kiro + the project directory*

🎙️ I built a harness that lets an AI agent (Kiro) interact with the application directly and start
building a "brain" — a map of how the app actually behaves — by exploring it, not by reading a spec.

🎙️ Three pieces:
- **Reusable tooling** to drive and read any web app — not specific to Quote & Apply, so it can be
  pointed at other screens or applications later.
- **Business-rules documentation** the agent produces as it discovers each rule — a living source
  of truth.

🖼️ *Initial business-rules page (the rulebook)*

🎙️ Each rule has a stable ID and the evidence behind it — so it can be referenced in a ticket
instead of re-explained every time.

---

## 3. From a user story to tests

🖼️ *The Default Commissions user story*

🎙️ The next step: point it at a real, recent user story — the Default Commission Category feature —
and have it generate automated tests mapped to each acceptance criterion.

🎙️ This is the loop: the agent uses its map of the app plus the user story to build tests that
check the app does what the story says it should.

---

## 4. The output — a test report

🖼️ *Latest test run report — start at the results table (passes)*

🎙️ Every run produces a report automatically. Here are the checks passing against the live app —
each one is a business rule, verified.

🖼️ *Scroll to a failed test — show the detail*

🎙️ And here's a failure. Notice what it captures automatically:
- the **acceptance criterion** it's checking, quoted from the user story,
- **expected vs. actual**,
- **steps to reproduce**, and a **screenshot** at the moment of failure.

🎙️ That's the valuable part: a failure like this can be attached straight to a Jira ticket. The
developer gets the requirement, the exact steps, and the evidence — no back-and-forth.

---

## 5. Where this goes

🎙️ The intent is a **full test suite that produces a regression report on every deployment** —
so we automatically know, each release, whether any business rule broke.

🎙️ What we anticipate that leads to:
- **More robust code** and **fewer defects reaching QA and production**.
- **Real time savings for developers** — "steps to reproduce" is a genuine pain point in the
  delivery cycle, and this generates them automatically.

🎙️ Next steps from here:
- Get the **regression suite** stood up and running per deployment.
- Start exploring **user-story grooming with the agent** — using it earlier, to improve the
  quality of requirements before they're built (which was one of the original problems).
