# Test Generation — Cumulative Learnings

Appended after each run of `TEST-GENERATION-PROCESS.md`, per its Step 7. Each entry is a short
"what to improve next time" note, newest first. Not a replay of the generation log — see each
story's `test-runs/<slug>/generation-log-*.md` for the full detail behind each entry.

## 2026-09-01 — Premium Details in the Quote Screen (ACB-2286)

- When a DOM-query probe finds "nothing" for a control the AC explicitly describes, treat that as
  "the query found nothing," not "the feature doesn't exist." AC08 was wrongly marked
  blocked/`test.fixme` after two probes failed to find a per-life collapse control — a screenshot
  from an unrelated test's failure later showed the control clearly working. Cross-check a
  DOM-query "not found" result against a screenshot from a nearby successful interaction before
  concluding "genuinely blocked."
- When a shared text-scoping helper is used for a NEGATIVE assertion (`not.toContain(...)`), audit
  its anchor pattern extra carefully. An anchor that's "good enough" for positive assertions (any
  match anywhere in a broad slice satisfies them) can be silently wrong-scoped and only surface as
  a bug on the first negative assertion that actually depends on precise scoping. (Two separate
  bugs of this shape hit the same helper in this run — scoping from the ambiguous word "Premium"
  instead of a more specific anchor.)
- Prefer a small number of well-planned, combined recon probes over many narrow one-off ones. 5
  probes were run before writing this story's spec — flagged by the user mid-session as too many.
  Check an existing sibling spec for an already-proven pattern (e.g. a prior story's multi-policy/
  frequency setup) BEFORE probing live from scratch, not after failing to reinvent it.
- `--workers=1` is the reliable choice for this app/account — `--workers=2` triggered a session-
  conflict cascade partway through a run (matches the environment's documented single-session-per-
  account constraint). The wall-clock cost is worth paying for reliability.
