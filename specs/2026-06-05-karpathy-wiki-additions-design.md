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
- **Mechanism lives in `kb-framework` (the engine); policy and artefacts stay in the
  instance.** `kb-framework` already embodies this split (`rules/` + `schemas/` +
  `agents/` + `pipeline/`); these additions must honour it rather than dump instance
  logic into the engine or engine logic into the instance.
- Regenerated artefacts carry `generated: true` and render the existing banner.

### Where each part lives

| Design part | `kb-framework` (engine, reusable) | EurSuRA-kb (instance, local) |
|---|---|---|
| **Catalog** | `build_catalog()` generator in `query.py` | `docs/catalog.md` + `catalog.json` artefacts; grouping config in `kb.yaml` |
| **Lint** | `lint.py` engine + `agents/linter.md`; enforces `rules/quality-checklist.md` | lint policy in `kb.yaml` (hard-vs-warn, ignore lists, `orphan_ok`); `logs/lint.log` |
| **Schema doc** | generic schema surface (`rules/` + `schemas/` + a tying-together overview) | thin `CLAUDE.md` pointer + instance specifics (domains, do-not-edit list) |
| **Docs refresh** | update stale `README.md` (missing `--synthesis`, three-layer merge, catalog, lint) | — |

Two consequences of this split, expanded in the components below: **(1)** lint is the
*automated enforcement of an existing framework rule* (`quality-checklist.md`), not a new
concept; **(2)** the "schema layer" Karpathy calls the key config file *already exists* in
`kb-framework` — the instance `CLAUDE.md` is therefore thin, mostly a pointer.

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

**This is the automated enforcement of an existing framework rule, not a new concept.**
`kb-framework/rules/quality-checklist.md` already defines the pre-publish checklist
(completeness, citations, links). `lint.py` operationalises it; it should reference that
rule file so the human-readable rule and its machine enforcement cannot drift. New checks
are added to the rule file first, then enforced in `lint.py`.

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

## Component 3 — Schema layer (mostly framework, thin instance pointer)

**Purpose:** Karpathy's "schema is the key configuration file." The catch: that schema
layer **already exists in `kb-framework`** (`rules/` + `schemas/` + the README). The work
is therefore *not* writing a big local schema — it is (a) giving the framework one tying-
together overview, and (b) shrinking the empty local `CLAUDE.md` to a thin pointer. This
keeps the schema reusable across KBs and avoids duplicating framework rules into every
instance.

**Framework side (`kb-framework`):**

- A short **schema overview** that ties `rules/` + `schemas/` + `agents/` together as the
  one Karpathy "schema" surface (e.g. a `schemas/README.md` or a section in the root
  README). It names the three layers and the canonical-vs-generated distinction once, for
  all KBs.
- Refresh the stale root `README.md`: document `--synthesis`, the three-layer merge
  ingest, and the new `--catalog` / `lint.py` surface.

**Instance side (EurSuRA-kb `CLAUDE.md`) — thin, link-heavy:**

- The instance's **actual** do-not-hand-edit list (`catalog.*`,
  `cross-reference-matrix.md`, `insights/*`, `models/*`).
- The instance's domains (ESRS/CSRD/EU Taxonomy/VSME/GHG/…) and `hooks.py` as the local
  wikilink resolver.
- A pointer to the `kb-framework` schema overview as the shared source of truth — **not** a
  copy of it.

**Decision (D):** hand-written (not `/init`-generated); the generic content lives in the
framework, the instance file stays short to avoid drift.

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
