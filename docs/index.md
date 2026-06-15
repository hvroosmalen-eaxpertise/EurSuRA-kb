---
title: Home
summary: A structured knowledge base on EU sustainability reporting for SMEs.
status: published
---

# EurSuRA Knowledge Base

The **EurSuRA Knowledge Base** is a structured wiki covering the standards,
directives, frameworks, and models relevant to **sustainability reporting in the
European Union**, with a focus on **small and medium-sized enterprises (SMEs)**.

Content is organised in three connected layers: canonical **domain pages** for
each standard and framework, a shared **glossary** of terms linked by
wiki-style cross-links, and a **synthesis layer** of cross-domain insights,
models, and a generated catalog.

## Explore

| Section | What you'll find |
|---|---|
| **Standards** | [ESRS](standards/esrs/index.md), [CSRD](standards/csrd/index.md), [EU Taxonomy](standards/eu-taxonomy/index.md), [VSME](standards/vsme/index.md), [GHG Protocol](standards/ghg-protocol/index.md) |
| **Frameworks** | [UN SDGs](frameworks/un-sdgs/index.md), [GRI](frameworks/gri/index.md), [TCFD](frameworks/tcfd/index.md) |
| **Models** | [Semantic model](models/semantic-model.md), [Concept map](models/concept-map.md), [Ontology](models/ontology.md), [Cross-reference matrix](cross-reference-matrix.md) |
| **Insights** | [Cross-domain synthesis pages](insights/index.md) on practical reporting questions |
| **Reports** | [Ingested source documents](reports/2026/index.md) summarised into draft pages |
| **Glossary** | [Definitions of all key terms](glossary.md), kept consistent across domains |
| **Catalog** | [Every page, grouped by type](catalog.md) — also served as [`catalog.json`](catalog.json) |

## How it grows

New sources are added by dropping a PDF into the ingestion pipeline, which
enriches the content, merges it into the relevant domain page, upserts glossary
terms, and regenerates the synthesis layer. See the
[project README](https://github.com/hvroosmalen-eaxpertise/EurSuRA-kb#readme)
for the full workflow.

!!! note "Draft quality"
    Many pages are auto-generated draft summaries from source documents —
    structurally complete but lower quality than hand-authored prose. Pages
    marked `status: draft` should be verified against their cited sources before
    being relied upon.
