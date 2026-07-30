# EurSuRA Knowledge Base

The **EurSuRA Knowledge Base** is a structured wiki covering the standards, directives, frameworks, and models relevant to sustainability reporting in the European Union — with a focus on **Small and Medium Enterprises (SMEs)**.

It is built with [MkDocs](https://www.mkdocs.org/) and the [Material theme](https://squidfunk.github.io/mkdocs-material/).

**Live wiki:** <https://hvroosmalen-eaxpertise.github.io/EurSuRA-kb/>

## Contents

| Section | Description |
|---|---|
| **Standards** | ESRS, CSRD, EU Taxonomy, VSME, GHG Protocol |
| **Frameworks** | UN SDGs, GRI, TCFD |
| **Models** | Semantic model, concept map, ontology, cross-reference matrix |
| **Glossary** | Definitions of all key terms |
| **Reports** | Ingested source documents, summarised into draft pages (under [2026](docs/reports/2026/index.md)) |

## Running the Wiki

There are two different commands and they are easy to confuse:

| Command | What it does | Keeps running? |
|---|---|---|
| `mkdocs serve` | Starts a local web **server** you browse | **Yes** — the service, leave it open |
| `mkdocs build` | Compiles the static site into `site/` once | **No** — it finishes and exits |

First-time setup — install the site dependencies once:

```bash
pip install -r requirements.txt
```

### Start the wiki (live server)

This is the command that **runs the wiki as a service**:

```bash
python -m mkdocs serve --config-file mkdocs.yml
```

It stays running and holds the terminal — open **http://127.0.0.1:8000** in your
browser, and it live-reloads whenever you edit a page. Press **Ctrl+C** to stop it.

To reach it from other devices on your network (phone, another PC), bind all
interfaces and browse to `http://<this-machine-ip>:8000`:

```bash
python -m mkdocs serve --config-file mkdocs.yml -a 0.0.0.0:8000
```

### Build the static site (compile once)

```bash
python -m mkdocs build --config-file mkdocs.yml
```

Unlike `serve`, this is a **one-shot build**: it renders the whole site into the
`site/` directory and exits. The command returning to the prompt (e.g.
`Documentation built in 32s`) means **success, not a crash** — there is no server
to keep running. Open `site/index.html` directly, or deploy the `site/` folder to
any static host (GitHub Pages, Azure Static Web Apps, etc.).

### Live site (GitHub Pages)

You usually don't need to run anything locally: the wiki is published
automatically on every push to `master` at
**<https://hvroosmalen-eaxpertise.github.io/EurSuRA-kb/>**. A machine-readable
catalog of every page is served at
[`/catalog.json`](https://hvroosmalen-eaxpertise.github.io/EurSuRA-kb/catalog.json).

### Diagrams (Mermaid)

The [concept map](docs/models/concept-map.md) and other pages use
[Mermaid.js](https://mermaid.js.org/) diagrams. Mermaid is enabled via
`pymdownx.superfences` in `mkdocs.yml` — no additional setup is required
beyond the config change.

**Interactive toolbar.** Every rendered diagram includes a toolbar below it
with three actions:

| Button | Action |
|--------|--------|
| **Copy source** | Copies the raw Mermaid code to the clipboard |
| **Download SVG** | Saves the diagram as a vector `.svg` file |
| **Open SVG** | Opens the diagram in a new browser tab for full-screen viewing |

The diagram is rendered client-side by loading Mermaid.js from CDN
(canonical source at
[`kb-framework/assets/javascripts/mermaid-toolbar.js`](../kb-framework/assets/javascripts/mermaid-toolbar.js)),
independent of the theme's built-in Mermaid loader. The file is copied to
`docs/assets/javascripts/` by `hooks.py` on every build.

## Adding Content

### Edit an existing page

All content lives in `docs/`. Each page is a Markdown file with a YAML frontmatter block. Edit the `.md` file and the dev server will reload automatically.

### Add a new page

1. Create a new `.md` file in the appropriate `docs/` subfolder.
2. Add a frontmatter block:
   ```yaml
   ---
   title: Your Title
   summary: One-line description
   content_type: standard | directive | framework | term | model | report
   domain: [ESRS]
   status: draft | published
   ---
   ```
3. Add the page to the `nav:` section in `mkdocs.yml`.

### Ingest a PDF source document

Drop the PDF into `pipeline/inbox/` and run the everyday pipeline loop from the
shared framework (see `framework_path` in `config/kb.yaml`), pointing it at this KB:

```bash
python ../kb-framework/pipeline/orchestrate.py --kb .
```

This KB runs most enrichment locally on Ollama (`qwen3:8b`) and keeps only the
domain **merge** on the Claude API — see the `enrich:` block in `config/kb.yaml`.
So you need both a running Ollama daemon *and* an `ANTHROPIC_API_KEY`: copy
`.env.example` to `.env` and set the key first.

`orchestrate.py` ingests every source in `pipeline/inbox/` (or a single `--file`),
runs the three-layer flow described below, regenerates the catalog, then **finalises**:
the **lint gate** and the **strict build** are hard gates, so a failure aborts before
anything is committed. On a clean run it commits **and pushes** by default. On failure
the offending PDF moves to `pipeline/failed/` and the error is recorded in
`logs/ingestion.log`. Useful flags:

| Flag | Effect |
|------|--------|
| `--no-push` | Commit locally but hold for review (no push) |
| `--no-commit` | Regenerate and gate, but leave the working tree uncommitted |
| `--deep` | Add the LLM contradiction check to the lint gate |
| `--no-lint` / `--no-strict` | Skip the respective gate |

> **Review-first alternatives.** To enrich without committing or pushing, run the
> ingest step alone (`python ../kb-framework/pipeline/ingest.py --kb .`) — it commits
> locally but never pushes. To finalise **without** ingesting anything new (e.g. after
> hand-edits), run the finalise stage directly:
> `python ../kb-framework/pipeline/finalize.py --kb . --no-push`.

> **Unreadable PDFs.** Extraction needs a real text layer. Two kinds fail it: a
> scanned/image-only PDF (near-zero characters) and a broken-font PDF (high char
> count but mojibake, from a broken ToUnicode map — no text extractor can recover
> it). Both would otherwise be *hallucinated* over. A readability guard now catches
> both right after extraction and fails the source loud to `pipeline/failed/` with
> a `needs OCR` note in `logs/ingestion.log`, so nothing garbled reaches the KB.
> OCR the source to real text (by convention, stage such sources in
> `pipeline/needs-ocr/`, gitignored) before relying on a page.

## How ingestion builds knowledge (the three layers)

A new source does not just add an isolated page — it grows the knowledge base on
three connected layers:

1. **Domain layer** — For a `standard`, `directive`, or `framework`, the enriched
   content is **merged into that domain's canonical `index.md`** (e.g. an ESRS PDF
   grows `docs/standards/esrs/index.md`) rather than creating a parallel page. The
   `domain-merge` agent integrates new facts, reconciles overlaps, and preserves
   curated prose. Reports stay standalone.
2. **Shared graph** — Terms are extracted and **upserted into the single
   `docs/glossary.md`** (updated in place if the term exists, appended if new) and
   always rendered in **alphabetical order** (case-insensitive), so terminology stays
   consistent across domains. Domain pages reference terms via
   `[[wikilinks]]` and never redefine them. `[[wikilinks]]` are resolved
   automatically (see `hooks.py`) and validated by the strict build.
3. **Synthesis layer** — Cross-domain *insight* pages, the cross-reference
   matrix, and the page **catalog** are **regenerated** from the current corpus
   (see Insights and Catalog below).

## Insights (cross-domain synthesis pages)

`docs/insights/` holds LLM-composed pages that combine several domains around a
practical question (e.g. "Climate Disclosure Across Frameworks"). They are
declared in `config/synthesis.yaml` and regenerated on every ingest, or manually:

```bash
python ../kb-framework/pipeline/query.py --kb . --synthesis
```

Insight pages, the cross-reference matrix, and the derived models carry
`generated: true` in their frontmatter and render a "Generated page" banner.
**Do not edit them by hand** — they are overwritten on regeneration. To change
one, edit its source domain pages or `config/synthesis.yaml`.

## Catalog (read API)

`docs/catalog.md` lists every page grouped by type; `docs/catalog.json` is the
same data as a machine-readable array, served on the live site at
[`/catalog.json`](https://hvroosmalen-eaxpertise.github.io/EurSuRA-kb/catalog.json).
Both carry `generated: true` and are regenerated on every ingest, or manually:

```bash
python ../kb-framework/pipeline/query.py --kb . --catalog
```

## Quality checks (lint)

`lint.py` health-checks the corpus: **orphans** (pages reachable from neither the
nav nor any `[[wikilink]]`), **stale/dangling sources**, and **missing
cross-references**; `--deep` adds an LLM contradiction check.

```bash
python ../kb-framework/pipeline/lint.py --kb .          # deterministic checks
python ../kb-framework/pipeline/lint.py --kb . --deep   # + contradiction check
```

It runs warn-only after each ingest. Policy — which finding kinds fail, and
glossary terms to ignore — lives in the `lint:` block of `config/kb.yaml`. CI
runs the deterministic checks as a hard gate.

## Rebuilding from scratch (bootstrap)

`bootstrap.py` rebuilds the wiki from the PDFs in `pipeline/inbox/`, using the
`mkdocs.yml` nav as the blueprint and the `domains:` map in `config/kb.yaml` to route
content. It splits each source across the domains it substantively covers, seeds the
glossary, regenerates models/insights/catalog, and scaffolds any unfilled nav page so the
strict build passes.

```bash
python ../kb-framework/pipeline/bootstrap.py --kb . --clean   # true from-scratch
```

Bootstrapped domain pages are auto-generated summaries from the source PDFs — structurally
complete but lower quality than hand-authored pages. Everyday `ingest` is unaffected.

To keep the from-scratch build **strict-clean**, bootstrap reconciles cross-references: it
resolves `[[domain-slug]]` links automatically (e.g. `[[eu-taxonomy]]`) and records any
remaining external concepts the LLM referenced in `config/known_external.txt`, so
`mkdocs build --strict` passes. Promote one of those to a real link by adding a page or
glossary entry and removing it from that file.

## Logs and Change History

| File | Purpose |
|---|---|
| `CHANGELOG.md` | Human-readable record of all content additions — ingested and manual |
| `logs/ingestion.log` | Machine-readable event log: START / EXTRACTED / WRITTEN / DONE / FAILED per PDF |
| `logs/enrichment.log` | Claude enrichment steps: style rewrite, tagging, domain merge, glossary upsert |
| `logs/token_usage.jsonl` | Per-call Claude token usage (input/output, labelled by stage); tally with `python ../kb-framework/pipeline/usage.py --kb .` |

## Cross-Reference Matrix

`docs/cross-reference-matrix.md` maps ESRS topics (E1–E5, S1–S4, G1) to GRI standards, TCFD pillars, EU Taxonomy objectives, and UN SDGs. Update it manually when new standards are added, or regenerate it with:

```bash
python ../kb-framework/pipeline/query.py --kb . --cross-ref
```

## Requirements

- Python 3.8+
- Install everything (site build + ingestion pipeline) from the pinned manifest:
  ```bash
  pip install -r requirements.txt
  ```
  To build/serve the wiki only, `mkdocs` and `mkdocs-material` are sufficient.

## Deployment (GitHub Pages)

The repository includes a GitHub Actions workflow at `.github/workflows/deploy.yml`. Pull requests run the deterministic **lint gate** (`lint.py`, failing on orphan/stale findings) and a strict build (`mkdocs build --strict`, failing on any unresolved `[[wikilink]]`); pushes to `master` build and deploy the site to GitHub Pages. Every page shows its last-update datetime in the footer, sourced from git history via the `git-revision-date-localized` plugin.

## Related Projects

- **EurSuRA** (`M:\EurSuRA`) — the EDGY-based reference architecture for SME sustainability, modelled in Sparx Enterprise Architect
- **kb-framework** (`M:\KnowledgeBase\kb-framework`) — shared rules, schemas, agent prompts, and pipeline scripts used by this knowledge base
