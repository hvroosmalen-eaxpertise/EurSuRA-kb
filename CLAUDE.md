# EurSuRA-kb

A MkDocs knowledge base for EU SME sustainability reporting, built on the shared
**kb-framework** engine (`../kb-framework`).

## Schema
This KB follows the framework schema layer. Do not duplicate it here — see
[`../kb-framework/schemas/README.md`](../kb-framework/schemas/README.md) for the
three layers, frontmatter, and operations.

## Domains
ESRS, CSRD, EU Taxonomy, VSME, GHG Protocol (standards); UN SDGs, GRI, TCFD
(frameworks). Terms live in `docs/glossary.md`.

## Generated - do NOT hand-edit
These carry `generated: true` and are overwritten on regeneration:
`docs/catalog.md`, `docs/catalog.json`, `docs/cross-reference-matrix.md`,
`docs/insights/*`, `docs/models/*`. To change one, edit its source domain pages
or `config/synthesis.yaml`.

## Local mechanics
- `hooks.py` resolves `[[wikilinks]]` at build time; `mkdocs build --strict`
  fails on any unresolved link.
- Pipeline (from this directory):
  - `python ../kb-framework/pipeline/ingest.py --kb .`
  - `python ../kb-framework/pipeline/query.py --kb . --catalog|--synthesis|--cross-ref`
  - `python ../kb-framework/pipeline/lint.py --kb . [--deep]`
- Lint policy is in `config/kb.yaml` (`lint:` block). Pages reachable only via
  search carry `orphan_ok: true`.

## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

Rules:
- For codebase questions, first run `graphify query "<question>"` when graphify-out/graph.json exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).
- Semantic extraction uses the local Ollama backend with `qwen3-coder:30b` (no cloud
  API key). The model is the user-env default (`OLLAMA_MODEL`), so full rebuilds are:
  `graphify extract . --backend ollama --max-concurrency 1`.
