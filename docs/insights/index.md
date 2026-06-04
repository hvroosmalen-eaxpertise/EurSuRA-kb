---
title: Insights
summary: Cross-domain synthesis pages that combine the standards and frameworks to answer practical reporting questions.
content_type: model
status: published
---

# Insights

The **Insights** section contains cross-domain *synthesis pages* — articles that
combine information from several standards and frameworks to answer a practical
question (for example, how an SME discloses climate information across ESRS,
TCFD, the GHG Protocol, and the EU Taxonomy).

Unlike the [[Semantic Model]] or [[Cross-Reference Matrix]], which describe the
*structure* of the knowledge base, insight pages read as connected prose and
draw their content directly from the underlying domain articles.

## How these pages are produced

Each insight is a **generated artefact**: it is composed by an LLM from the
canonical text of its source domain pages and the [[glossary]], and is
regenerated automatically whenever one of those domains changes. The set of
insight pages is declared in `config/synthesis.yaml`.

Because they are regenerated, insight pages should not be edited by hand — to
change one, edit its source domain articles or the synthesis configuration.
