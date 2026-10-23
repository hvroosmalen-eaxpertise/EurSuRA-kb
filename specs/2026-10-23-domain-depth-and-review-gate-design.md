# #21 — Domain depth, three new regimes, and a review gate

**Date:** 2026-10-23
**Issue:** [#21](https://github.com/hvroosmalen-eaxpertise/EurSuRA-kb/issues/21)
**Related:** [#9](https://github.com/hvroosmalen-eaxpertise/EurSuRA-kb/issues/9) (resolved alongside)

## Intent

Make the eight existing domain pages real reference material instead of
stubs; add three missing EU regimes (CSDDD, SFDR, ISSB/IFRS S1–S2);
introduce a `draft → published` review gate so canonical pages can be
explicitly promoted and distinguished from in-flight content.

## Non-goals

- No new ingest-pipeline features.
- No Pages / CI changes.
- Not touching the reports corpus (that's #22).

## Starting state (2026-10-23)

| Domain | Lines | Verdict |
|---|---|---|
| EU Taxonomy | 15 | stub |
| GRI | 15 | stub |
| TCFD | 15 | stub |
| UN-SDGs | 15 | stub (one paragraph) |
| VSME | 21 | thin |
| CSRD | 43 | short |
| GHG | 42 | short |
| ESRS | 50 | short |
| CSDDD, SFDR, ISSB/IFRS S1–S2 | — | missing |

Status counts: 26 `draft`, 3 `published` — but all three "published"
pages are empty landing `index.md` stubs. No content page has been
reviewed/promoted yet.

## Phases (one PR each)

Each phase lands on a feature branch and merges via its own PR.

### Phase 1 — Ingest the current batch

Run `orchestrate.py` on the 8 CSR / strategy PDFs sitting in
`pipeline/inbox/`. These will land as reports in `docs/reports/2026/`
and may feed small amounts of depth into CSRD / SDG canonical pages via
the merge step. Low-cost sanity pass; local Ollama only, no Claude spend.

Branch: `issue-21-phase-1-ingest-batch`.

### Phase 2 — Three new regimes

New canonical domain pages, hand-drafted at reference depth from
publicly known information. Each carries
`source_file: hand-drafted-overview-2026-10-23` so provenance stays
explicit about the non-ingest origin.

- `docs/standards/csddd/index.md` — Corporate Sustainability Due
  Diligence Directive (Directive 2024/1760): scope, due-diligence
  steps, transition rules, SME indirect impact.
- `docs/standards/sfdr/index.md` — Sustainable Finance Disclosure
  Regulation (Regulation 2019/2088): Article 6/8/9 classification, PAI
  indicators, RTS updates.
- `docs/standards/issb/index.md` — ISSB / IFRS S1 (general) & S2
  (climate): relationship to TCFD, EU interoperability guidance. **ISSB
  under Standards, not Frameworks** — IFRS S1/S2 are formal standards.

Plumbing:
- `config/kb.yaml` → `domains:` map adds CSDDD, SFDR, ISSB.
- `mkdocs.yml` → three entries under Standards.
- `hooks.py` → `MANUAL_ALIASES` for ISSB / IFRS S1 / IFRS S2 now point
  to the new pages (currently resolve to glossary anchors).

Branch: `issue-21-phase-2-new-regimes`.

### Phase 3 — Flesh the four worst stubs

Hand-written reference depth replacing (not appending to) the current
single-paragraph stubs. Each page lands in the 100–250-line range,
Wikipedia-style, with inline wikilinks.

- **EU Taxonomy** — six environmental objectives, DNSH, minimum
  safeguards, Article 8 reporting, delegated acts.
- **GRI** — Universal / Sector / Topic Standards (2021 revision),
  reporting principles, materiality under GRI, interoperability with
  ESRS.
- **TCFD** — four pillars, 11 recommendations, climate scenarios,
  dissolution into ISSB in 2024.
- **UN-SDGs** — 17 goals + 169 targets, indicator framework, business
  linkage, SDG-washing concerns.

VSME is **not** in this phase — 21 lines isn't a true stub, and the
user's deep VSME focus makes it a special case for a later pass.

Branch: `issue-21-phase-3-stub-depth`.

### Phase 4 — Review gate

- Frontmatter schema: add optional `reviewed_by:` and `reviewed_on:`
  fields (required when `status: published`).
- `kb-framework/pipeline/lint.py`: new lint kind `UNREVIEWED` — a page
  with `status: published` that lacks `reviewed_by` / `reviewed_on` is
  a hard failure.
- `config/kb.yaml` `lint.hard_fail` list → add `UNREVIEWED`.
- First pass through the gate: promote **ESRS, CSRD, VSME** to
  `published`, plus any Phase 2 / Phase 3 pages that pass review on
  that same cycle.

Branch: `issue-21-phase-4-review-gate` (lives in kb-framework repo for
`lint.py`, in EurSuRA for `config/kb.yaml` and the promotions).

### Phase 5 — Verify, regenerate, close

- `mkdocs build --strict` passes.
- `python ../kb-framework/pipeline/lint.py --kb . --deep` passes.
- Regenerate catalog, cross-reference matrix, sdg-summary.
- Close #21 and #9 with solution comments.

Rolled into the Phase 4 PR (final step) — no separate branch.

## Settled calls

- ISSB under **Standards** (user confirmed 2026-10-23).
- Phase 3 skips VSME.
- Lint-rule name is `UNREVIEWED`.
- Hand-drafted pages carry
  `source_file: hand-drafted-overview-2026-10-23`.
- One feature branch per phase, one PR per phase, PR title names the
  phase.
- Pages drafted in Phase 2 / Phase 3 that pass review get promoted to
  `published` in Phase 4 alongside ESRS / CSRD / VSME.

## Open to the builder

The builder here is me, continuing in-session. Nothing in the above
needs further decisions from the user before Phase 1 starts.
