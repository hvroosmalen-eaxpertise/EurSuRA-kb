"""
MkDocs hook: resolve [[wikilinks]] to proper relative markdown links.

Runs on every page before rendering. Unknown wikilinks are rendered as plain text.
"""

import os
import re
from pathlib import PurePosixPath

WIKILINK_RE = re.compile(r'\[\[([^\]|]+?)(?:\|([^\]]+))?\]\]')

# Normalised wikilink text → path relative to docs root
LINK_MAP = {
    # ── Standards ──────────────────────────────────────────────────────────────
    "esrs": "standards/esrs/index.md",
    "esrs 1": "standards/esrs/index.md",
    "esrs e1": "standards/esrs/index.md",
    "esrs — european sustainability reporting standards": "standards/esrs/index.md",
    "esrs — european sustainability reporting standards|esrs": "standards/esrs/index.md",
    "european sustainability reporting standards": "standards/esrs/index.md",

    "csrd": "standards/csrd/index.md",
    "csrd — corporate sustainability reporting directive": "standards/csrd/index.md",
    "csrd — corporate sustainability reporting directive|csrd": "standards/csrd/index.md",
    "corporate sustainability reporting directive": "standards/csrd/index.md",
    "corporate sustainability reporting directive (csrd)": "standards/csrd/index.md",

    "eu taxonomy": "standards/eu-taxonomy/index.md",
    "eu taxonomy regulation": "standards/eu-taxonomy/index.md",

    "vsme": "standards/vsme/index.md",
    "vsme — voluntary sustainability reporting standard for non-listed smes": "standards/vsme/index.md",
    "vsme — voluntary sustainability reporting standard for non-listed smes|vsme": "standards/vsme/index.md",
    "voluntary sustainability reporting standard for non-listed smes": "standards/vsme/index.md",
    "small and medium-sized enterprises": "standards/vsme/index.md",
    "sme": "standards/vsme/index.md",
    "smes": "standards/vsme/index.md",

    "ghg protocol": "standards/ghg-protocol/index.md",
    "ghg protocol corporate standard": "standards/ghg-protocol/index.md",

    # ── Frameworks ─────────────────────────────────────────────────────────────
    "gri": "frameworks/gri/index.md",
    "gri — global reporting initiative": "frameworks/gri/index.md",
    "gri — global reporting initiative|gri standards": "frameworks/gri/index.md",
    "global reporting initiative": "frameworks/gri/index.md",

    "tcfd": "frameworks/tcfd/index.md",
    "tcfd — task force on climate-related financial disclosures": "frameworks/tcfd/index.md",
    "tcfd — task force on climate-related financial disclosures|tcfd": "frameworks/tcfd/index.md",
    "task force on climate-related financial disclosures": "frameworks/tcfd/index.md",
    "task force on climate-related financial disclosures": "frameworks/tcfd/index.md",

    "un sustainable development goals": "frameworks/un-sdgs/index.md",
    "un sdgs": "frameworks/un-sdgs/index.md",
    "sdgs": "frameworks/un-sdgs/index.md",
    "sustainable development goals": "frameworks/un-sdgs/index.md",

    # ── Models ──────────────────────────────────────────────────────────────────
    "semantic model": "models/semantic-model.md",
    "concept map": "models/concept-map.md",
    "ontology": "models/ontology.md",
    "cross-reference matrix": "cross-reference-matrix.md",

    # ── Glossary terms ──────────────────────────────────────────────────────────
    "double materiality": "glossary.md",
    "double materiality assessment": "glossary.md",
    "materiality assessment": "glossary.md",
    "impact materiality": "glossary.md",
    "financial materiality": "glossary.md",

    "dnsh": "glossary.md",
    "do no significant harm": "glossary.md",

    "efrag": "glossary.md",
    "european financial reporting advisory group": "glossary.md",
    "european financial reporting advisory group (efrag)": "glossary.md",

    "nfrd": "glossary.md",

    "ifrs s1": "glossary.md",
    "ifrs s2": "glossary.md",
    "ifrs s2 climate-related disclosures": "glossary.md",
    "international sustainability standards board": "glossary.md",
    "issb": "glossary.md",

    "scope 1": "glossary.md",
    "scope 2": "glossary.md",
    "scope 3": "glossary.md",
    "scope 1 emissions": "glossary.md",
    "scope 2 emissions": "glossary.md",
    "scope 3 emissions": "glossary.md",
    "scope 1, 2, and 3": "glossary.md",
    "scope 1, 2, and 3 emissions": "glossary.md",

    "taxonomy alignment": "glossary.md",
    "taxonomy eligibility": "glossary.md",

    "vsme": "standards/vsme/index.md",
}


def on_page_markdown(markdown, page, config, **kwargs):
    src = page.file.src_path.replace("\\", "/")
    current_dir = PurePosixPath(src).parent

    def replace(match):
        link_key = match.group(1).strip()
        display  = (match.group(2) or link_key).strip()
        target   = LINK_MAP.get(link_key.lower())
        if not target:
            return display  # unknown link → plain text, no broken anchor
        rel = os.path.relpath(target, str(current_dir)).replace("\\", "/")
        return f"[{display}]({rel})"

    return WIKILINK_RE.sub(replace, markdown)
