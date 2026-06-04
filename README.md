# EurSuRA Knowledge Base

The **EurSuRA Knowledge Base** is a structured wiki covering the standards, directives, frameworks, and models relevant to sustainability reporting in the European Union — with a focus on **Small and Medium Enterprises (SMEs)**.

It is built with [MkDocs](https://www.mkdocs.org/) and the [Material theme](https://squidfunk.github.io/mkdocs-material/).

## Contents

| Section | Description |
|---|---|
| **Standards** | ESRS, CSRD, EU Taxonomy, VSME, GHG Protocol |
| **Frameworks** | UN SDGs, GRI, TCFD |
| **Models** | Semantic model, concept map, ontology, cross-reference matrix |
| **Glossary** | Definitions of all key terms |
| **Reports** | Ingested sustainability reports (2025) |

## Viewing the Wiki

### Locally (development server)

```bash
python -m mkdocs serve --config-file mkdocs.yml
```

Then open **http://127.0.0.1:8000** in your browser. The server reloads automatically when you edit any markdown file.

### Built site

A pre-built version of the site is in the `site/` directory. Open `site/index.html` directly in a browser, or deploy the `site/` folder to any static hosting service (GitHub Pages, Azure Static Web Apps, etc.).

To rebuild after editing content:

```bash
python -m mkdocs build --config-file mkdocs.yml
```

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

Drop the PDF into `pipeline/inbox/` and run the ingestion script from the shared
framework (see `framework_path` in `config/kb.yaml`), pointing it at this KB:

```bash
python ../kb-framework/pipeline/ingest.py --kb .
```

The pipeline calls the Claude API for enrichment, so copy `.env.example` to
`.env` and set `ANTHROPIC_API_KEY` first.

On success the pipeline:
1. Moves the PDF to `pipeline/processed/`
2. Writes the enriched Markdown article to `docs/`
3. Appends an entry to `CHANGELOG.md`
4. Logs the full event sequence to `logs/ingestion.log`

On failure the PDF moves to `pipeline/failed/` and the error is recorded in `logs/ingestion.log`.

## Logs and Change History

| File | Purpose |
|---|---|
| `CHANGELOG.md` | Human-readable record of all content additions — ingested and manual |
| `logs/ingestion.log` | Machine-readable event log: START / EXTRACTED / WRITTEN / DONE / FAILED per PDF |
| `logs/enrichment.log` | Claude enrichment steps: style rewrite, tagging, term extraction |

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

The repository includes a GitHub Actions workflow at `.github/workflows/deploy.yml`. Pull requests run a strict build (`mkdocs build --strict`), which fails on any unresolved `[[wikilink]]`; pushes to `master` build and deploy the site to GitHub Pages.

## Related Projects

- **EurSuRA** (`M:\EurSuRA`) — the EDGY-based reference architecture for SME sustainability, modelled in Sparx Enterprise Architect
- **kb-framework** (`M:\KnowledgeBase\kb-framework`) — shared rules, schemas, agent prompts, and pipeline scripts used by this knowledge base
