# Design: `bootstrap` — from-scratch wiki build

**Date:** 2026-06-05
**Status:** Approved (design); pending implementation plan
**Repos:** mechanism in `kb-framework` (engine); config/blueprint in `EurSuRA-kb` (instance).

## Context

A rehearsal (ingesting the 5 inbox PDFs into a throwaway copy with an empty `docs/`)
plus a frontmatter-fingerprint audit established the problem: **only the 5
`reports/2026/*` pages were ever produced by `ingest.py`**; the other 19 pages
(standards, frameworks, glossary, models, insights, index pages) were hand-authored at
design time. The current pipeline therefore cannot rebuild the wiki from scratch — it
writes **one `report` page per PDF**, never creates a glossary from empty
(`enrich_glossary` returns early if `glossary.md` is absent), and never runs `--model`.
A from-scratch run yields 7 pages and a **failing** `mkdocs build --strict` (17 dangling
nav refs + many unresolved `[[wikilinks]]`).

**This feature adds an explicit `bootstrap` operation** that rebuilds a structured wiki
from a folder of PDFs, using the existing `mkdocs.yml` nav as the blueprint, ending in a
**passing strict build**. Everyday `ingest` is unchanged.

### Decisions locked during brainstorming
1. **Split into domain pages** — one source fans out across the domains it *substantively*
   covers (a materiality guard excludes tangential mentions).
2. **Separate bootstrap mode** — the splitting/scaffolding lives in a contained operation,
   not in everyday `ingest` (which keeps its stable single-target merge).
3. **`mkdocs.yml` nav is the blueprint** — bootstrap builds toward it; the domain
   tag→path map moves from hardcoded engine code into instance config.

## Goals

- From an empty `docs/` (nav intact), produce a page for every nav entry, a populated
  glossary, regenerated models/insights/catalog, and a **passing strict build**.
- Keep the shared engine generic; EurSuRA-specific structure lives in instance config.

## Non-goals

- Reproducing the **curated prose** of the original hand-authored pages. Bootstrap
  reproduces *structure*; auto-generated domain pages are summaries from report sources
  and are lower quality than the originals. This is inherent to "build from these PDFs."
- Changing everyday `ingest` behaviour (beyond the shared glossary-seed fix and reading
  the domain map from config instead of a hardcoded dict).
- Deleting content. Clearing `docs/` is a separate, deliberate step (or an opt-in flag).

## Architecture

Mechanism in `kb-framework`; blueprint/config in the instance. Bootstrap reuses existing
pipeline pieces rather than duplicating them: `extract_markdown`, the `wikipedia-style`
and `domain-merge` and `tagger` agents, `enrich_glossary`, `query.py`, `rebuild.py`.

### New components (engine)

**`kb-framework/agents/splitter.md`** — system prompt. Input: a source's Wikipedia-style
article + the blueprint domain list (tags + short descriptions). Output: for each domain
the source **substantively** covers, a block of domain-relevant prose. Domains only
mentioned in passing are omitted. Output format is parseable (e.g. one
`## DOMAIN: <tag>` section per substantive domain), so `bootstrap.py` can route each
block. If the source is not substantively about any blueprint domain, the splitter
returns nothing and the source is treated as a standalone report.

**`kb-framework/pipeline/bootstrap.py`** — orchestrator. Flow:

1. **Load blueprint.** Parse `mkdocs.yml` nav into the set of expected doc paths and their
   section/label structure. Load the `domains:` tag→path map from `config/kb.yaml`.
2. **Per PDF** (from `pipeline/inbox/`):
   a. `extract_markdown` → raw text.
   b. `wikipedia-style` rewrite → article.
   c. **splitter** → substantive-domain blocks.
   d. For each block: resolve the domain tag to its `index.md` via the `domains:` map;
      **merge** the block into that page using the existing `domain-merge` agent
      (create the file with fresh frontmatter if absent); ensure the page has a nav entry
      under the right section (insert if missing).
   e. If the splitter returned no domain (or the `tagger` classifies it `report`), write a
      standalone report page (existing `determine_output_path` + report nav behaviour).
   f. Move the PDF to `processed/`; append to `CHANGELOG.md`.
3. **Glossary.** Seed an empty `glossary.md` (title + `# Glossary` heading) if absent, then
   upsert terms per source (existing `enrich_glossary`, now able to create-then-upsert).
4. **Regenerate derived layers** (once, after all PDFs): `query.py --kb . --model
   semantic-model --model concept-map --model ontology --cross-ref --synthesis --catalog`.
   (Bootstrap adds the `--model` runs that everyday ingest omits.)
5. **Scaffold** any nav-listed page still missing on disk with a minimal valid stub
   (frontmatter `title` from the nav label + an H1 + a one-line "stub" note) so the strict
   build cannot fail on a dangling nav reference.
6. **Build + commit** via `rebuild.py` (local commit, no push).

**Behaviour flags:** `--clean` (default **off**) removes `docs/**/*.md` before building, for
a true from-scratch run; without it, bootstrap creates-missing / merges-existing.

### Config change (instance)

Add a `domains:` map to `config/kb.yaml`, e.g.:

```yaml
domains:
  ESRS: standards/esrs/index.md
  CSRD: standards/csrd/index.md
  EU-TAXONOMY: standards/eu-taxonomy/index.md
  VSME: standards/vsme/index.md
  GHG: standards/ghg-protocol/index.md
  GRI: frameworks/gri/index.md
  TCFD: frameworks/tcfd/index.md
  SDG: frameworks/un-sdgs/index.md
```

**Remove the hardcoded `DOMAIN_INDEX` dict from `ingest.py`**; both `ingest` and
`bootstrap` read the map from `config/kb.yaml` (fallback to empty if absent). This removes
EurSuRA-specific data from the shared engine.

## Data flow (one bootstrap run)

```
inbox/*.pdf
  -> extract -> wiki-rewrite -> splitter -> {DOMAIN: prose}
       -> per domain: domain-merge into domains[tag]  (+ nav entry)
       -> else: standalone report page (+ reports nav)
       -> glossary seed-if-absent + term upsert
after all:
  -> query.py --model x3 --cross-ref --synthesis --catalog
  -> scaffold missing nav pages as stubs
  -> rebuild.py (build + local commit)
result: a page per nav entry; strict build passes
```

## Error handling

- A PDF that fails extraction/enrichment is moved to `failed/` and logged
  (`logs/ingestion.log`), as today; bootstrap continues with the rest.
- Splitter output that doesn't parse → treat the source as a standalone report (safe
  fallback), logged as a warning.
- A `domains:` tag with no matching nav path → log a warning and skip that block (don't
  invent a page outside the blueprint).
- Scaffolding only ever *adds* stub files for nav paths with no page; it never overwrites
  an existing page.

## Testing (no live LLM, per the project's verification approach)

Unit tests in `kb-framework/tests/test_bootstrap.py`, on a tiny fixture KB (a `mkdocs.yml`
with a few nav entries, a `config/kb.yaml` with a `domains:` map, an empty `docs/`):

- **Blueprint parsing:** nav → expected doc-path set (reuse/extend
  `lint.nav_paths_from_mkdocs`).
- **Domains config loading:** tag→path map read from `kb.yaml`; empty/missing tolerated.
- **Splitter routing:** monkeypatch `call_claude` to return a canned
  `## DOMAIN: ESRS ...` block; assert it is merged into `standards/esrs/index.md` and a nav
  entry is ensured.
- **Report fallback:** splitter returns nothing → a standalone report page is written.
- **Glossary seed-if-absent:** with no `glossary.md`, a seeded file is created then upserted.
- **Scaffolding:** a nav entry with no page yields a stub file with valid frontmatter; an
  existing page is left untouched.
- **Strict-build gate:** after a monkeypatched bootstrap run on the fixture,
  `mkdocs build --strict` succeeds (no dangling nav, no unresolved wikilinks in stubs).

End-to-end (manual, with `ANTHROPIC_API_KEY`): run `bootstrap.py --clean` against a copy
seeded with the 5 PDFs; assert the produced page set covers the nav and the strict build
is green.

## Success criteria

`bootstrap.py --kb . --clean` on the real KB (nav intact, `docs/` cleared): every nav
entry has a page, glossary populated, models/insights/catalog regenerated, and
`mkdocs build --strict` passes — with the understood quality caveat above.

## Out of scope / future

- Improving auto-generated domain-page quality (better splitter prompts, per-domain source
  curation).
- A generic "new KB from a manifest" mode for KBs that have no existing nav yet.
