# Design: Selectively Adopting Karpathy's LLM Wiki Conventions

**Date:** 2026-06-05
**Status:** Approved (design); pending implementation plan
**Source idea:** Karpathy, "LLM Wiki" — https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f

## Context

The EurSuRA KB is already a concrete — and in places more advanced — implementation
of Karpathy's "LLM Wiki" pattern. The gist is intentionally abstract (a pattern, not
an implementation). A wholesale migration would remove things that are stronger than
the gist (merge-into-canonical `index.md`, auto-resolved wikilinks + strict build gate,
the regenerated synthesis layer with a generated-page banner).

**Decision: do not migrate the wiki style. Selectively adopt the three Karpathy
conventions the KB is genuinely missing.** Each is an *addition*, not a rewrite, and
each follows patterns already present in the repo: derived from frontmatter the KB
already writes, implemented in the shared `kb-framework` pipeline, and config-driven
from the local `config/kb.yaml` — exactly like the existing `--synthesis` and
`--cross-ref` modes.

### Gap analysis (Karpathy convention → current state)

| Karpathy convention | Current state | Action |
|---|---|---|
| `ingest` / `query` / **`lint`** operations | ingest + query; **no semantic lint** | Component 2 |
| `index.md` content catalog (every page, 1-line summary) | per-domain `index.md`; **no global catalog** | Component 1 |
| schema = `CLAUDE.md` ("the key config file") | schema only in `kb-framework`; **local `CLAUDE.md` empty** | Component 3 |

## Goals

1. **Read API foundation** — expose KB content through a machine-readable interface.
2. **Change-safety / modularity** — "parts of the wiki may change, but the whole keeps
   working" — enforced by guardrails, not by restructuring.
3. **Self-describing repo** — the local conventions written down where any agent (or
   human) working in the repo will find them.

## Non-goals

- No restructuring of the existing three layers (domain / glossary graph / synthesis).
- No change to merge-into-canonical ingest, wikilink resolution, or the generated banner.
- **Sparx EA auto-ingest is out of scope.** It is the next workstream, layered on top
  once the catalog + lint exist. (The catalog JSON endpoint is, in fact, the surface a
  later EA sync would write into.)

## Shared principles

- Derive from frontmatter already written by the pipeline (`load_articles()` in
  `query.py` already parses it). No new hand-maintained tables.
- Live in `kb-framework/pipeline/` (shared across KBs); configured from local
  `config/kb.yaml`.
- Regenerated artefacts carry `generated: true` and render the existing banner.

---

## Component 1 — Generated root catalog

**Purpose:** Karpathy's "index before drilling," and the first endpoint of the read API.

**Implementation:** a new `--catalog` mode in `kb-framework/pipeline/query.py`,
deterministic (no LLM), modelled on `build_cross_ref()`. Emits two artefacts:

- **`docs/catalog.md`** — human page. `generated: true` (renders the banner). Lists
  every page grouped by section, each with: title · summary · `content_type` ·
  `domain` · `status` · relative link.
- **`docs/catalog.json`** — machine array; one object per page with keys:
  `title, summary, content_type, domain, status, url, wikilinks` (outbound links).
  MkDocs copies non-`.md` files under `docs/` into the built `site/`, so this is served
  at `/catalog.json` with no extra tooling. **This is the read API's first endpoint.**

**Data source:** `load_articles()` frontmatter + outbound `[[wikilink]]` extraction
(same regex as `hooks.py`, `WIKILINK_RE`).

**Integration:** add a `build_catalog(kb_root)` call to `ingest.py` alongside the
existing cross-ref/synthesis regeneration, and a `--catalog` flag to `query.py`'s
argument parser for manual runs.

**Decision (A):** ship **both** MD and JSON. Humans get a browsable page; the API gets
structured JSON.

**Exclusions:** the catalog itself and other `generated: true` pages are listed in the
catalog but flagged (so a future API consumer can distinguish canonical from derived).

## Component 2 — `lint` pass

**Purpose:** the change-safety guardrail. Today the strict `mkdocs build` catches broken
*links*; nothing catches broken *meaning* (contradictions, orphans, stale derivations).
This matters most once content arrives faster than a human diffs every change.

**Implementation:** a new `kb-framework/pipeline/lint.py` — a *checker*, not a generator.
Writes `logs/lint.log` and a console summary; **exits non-zero on hard failures** so CI
can gate it, mirroring `mkdocs build --strict`.

**Checks, two tiers:**

- **Deterministic (free, always on — the CI gate):**
  - **Orphans** — pages reachable from neither `nav` (in `mkdocs.yml`) nor any
    `[[wikilink]]`. Reuses the link-index logic from `hooks.py`.
  - **Stale / dangling sources** — a page's `sources:` frontmatter pointing at pages that
    no longer exist; a `generated` page whose `date_updated` predates a source it derives
    from.
  - **Missing cross-references** — body text mentioning a glossary term verbatim without
    wrapping it in a `[[wikilink]]`.
- **Semantic (LLM, opt-in `--deep`):**
  - **Contradictions** — feeds canonical domain pages + `glossary.md` to a new
    `kb-framework/agents/linter.md` prompt; returns flagged conflicting claims with page
    references. Loaded via the existing `load_agent_prompt()` helper.

**Decisions (B, C):**
- (B) the LLM contradiction check is **opt-in via `--deep`**; deterministic checks always
  run and form the CI gate. Keeps routine/CI runs free and fast.
- (C) on local ingest, lint **warns only** (never blocks the local commit); **CI** is the
  hard gate. Matches the existing review-before-push flow.

**Config:** `config/kb.yaml` gains an optional `lint:` block (e.g. which checks are
hard-fail vs warn, glossary-term ignore list) with safe defaults if absent.

**Output format:** grouped findings (`ORPHAN` / `STALE` / `XREF` / `CONTRADICTION`) with
`path:detail`, plus a one-line pass/fail summary and counts.

## Component 3 — Local schema file (`CLAUDE.md`)

**Purpose:** Karpathy's "schema is the key configuration file." The local `CLAUDE.md` is
currently empty (0 bytes); the schema lives only in `kb-framework`. Make the repo
self-describing without duplicating the shared rules.

**Content (a short schema-of-record, not a copy of `kb-framework`):**

- The three layers (domain / glossary graph / synthesis) and what is **canonical vs
  generated** — i.e. the do-not-hand-edit list (`catalog.*`, `cross-reference-matrix.md`,
  `insights/*`, `models/*`).
- The frontmatter schema and wikilink rules, pointing to `hooks.py` for the resolver.
- The pipeline command surface: ingest / `--catalog` / `--synthesis` / `--cross-ref` /
  lint.
- A pointer to `kb-framework` (rules, agents, schemas) as the shared source of truth.

**Decision (D):** hand-written to match the layer model (not `/init`-generated), kept
short and link-heavy to avoid drift with `kb-framework`.

---

## Component interaction

- **Ingest** (existing) → regenerates synthesis + cross-ref + **catalog (new)** → runs
  **lint (new, warn-only locally)** → commits locally (no push; human reviews).
- **CI** → `mkdocs build --strict` (links) + **`lint.py` deterministic tier (meaning)** →
  hard gate before deploy.
- **Read API (future)** → serves `docs/catalog.json`; later, `qmd`/BM25 over markdown for
  deeper queries.
- **`CLAUDE.md`** documents all of the above as the local schema.

## Risks / open questions

- **Orphan check vs `nav`:** report-style pages intentionally reachable only via search
  may flag as orphans. Mitigation: a `lint:` ignore list / an `orphan_ok: true`
  frontmatter flag. Resolve during implementation.
- **`catalog.json` size:** trivial at current corpus scale; revisit only if the KB grows
  to thousands of pages.
- **`--deep` lint cost:** bounded by being opt-in and excluded from CI by default.

## Out of scope (future workstreams)

- Sparx EA auto-ingest (entities/relationships → glossary graph + models layer; pull via
  EA API/SQL or exported XMI; read-source vs write-target TBD).
- `qmd`/vector search tier for the read API beyond the JSON catalog.
