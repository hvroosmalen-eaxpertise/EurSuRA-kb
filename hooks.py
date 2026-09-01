"""
MkDocs hooks for the EurSuRA Knowledge Base.

Resolves ``[[wikilinks]]`` to relative Markdown links using an index that is
built automatically from page titles and glossary headings — there is no
hand-maintained link table to keep in sync.

Behaviour:

* A link that matches a page title, a title abbreviation, or a glossary term
  resolves to the correct relative path, **including the heading anchor** for
  glossary terms (e.g. ``[[Double Materiality]]`` → ``glossary.md#double-materiality``).
* A link that cannot be resolved and is *not* in ``KNOWN_EXTERNAL`` renders as
  plain text **and emits a build warning**. Under ``mkdocs build --strict`` this
  fails the build, so a broken cross-reference can never silently disappear again.
* ``KNOWN_EXTERNAL`` lists concepts that are deliberately referenced but do not
  (yet) have a page or glossary entry. They render as plain text without a
  warning. To turn one into a real link, add a glossary entry (or page) and
  remove it from this set.
"""

import os
import re
import logging
from pathlib import Path, PurePosixPath

from markdown.extensions.toc import slugify

log = logging.getLogger("mkdocs.plugins.eursura.wikilinks")

WIKILINK_RE = re.compile(r"\[\[([^\]|]+?)(?:\|([^\]]+))?\]\]")
HEADING_RE = re.compile(r"^#{2,3}\s+(.+?)\s*#*$", re.MULTILINE)
PAREN_RE = re.compile(r"^(.*?)\s*\(([^)]+)\)\s*$")

# Concepts intentionally referenced without a local target (no page / glossary
# entry yet). These render as plain text and do NOT raise a warning. Add a
# glossary entry and remove the term here to turn it into a live link.
KNOWN_EXTERNAL = {
    "ai continent action plan",
    "artificial intelligence",
    "carbon border adjustment mechanism",
    "carbon disclosure project",
    "carbon leakage",
    "climate change",
    "corporate social responsibility",
    "corporate sustainability due diligence directive",
    "esg (environmental, social, and governance)",
    "ifrs foundation",
    "digital decade policy programme",
    "digital skills indicator",
    "european strategy for a better internet for kids",
    "greenhouse gas",
    "greenwashing",
    "grievance mechanisms in business and human rights",
    "integrated reporting",
    "joint research centre",
    "oecd guidelines for multinational enterprises",
    "paris agreement",
    "principles for responsible investment",
    "renewable energy",
    "science-based targets",
    "science-based targets initiative (sbti)",
    "sustainability accounting standards board",
    "sustainable finance disclosure regulation",
    "un global compact",
    "un guiding principles on business and human rights",
    "union of skills",
    "united nations guiding principles on business and human rights",
    "value chain due diligence",
    # From known_external.txt - auto-recorded external concepts
    "affected communities",
    "ai environmental impact",
    "anti-corruption policy",
    "biodiversity and ecosystems",
    "biodiversity loss",
    "carbon border adjustment mechanism (cbam)",
    "carbon offsets",
    "climate change mitigation",
    "climate-related financial risk",
    "corporate law",
    "corporate sustainability reporting",
    "digital competence",
    "digital decade policy programme",
    "digital skills indicator",
    "dma",
    "double materiality assessment (dma)",
    "due diligence in responsible business conduct",
    "ecodesign for sustainable products regulation",
    "embodied carbon",
    "eu corporate sustainability reporting directive",
    "european strategy for a better internet for kids",
    "expected lifespan",
    "global and national accounts",
    "green software foundation",
    "greenhouse gas emissions reporting",
    "grievance mechanisms in business and human rights",
    "ifrs",
    "ifrs sustainability standards",
    "impact assessment",
    "joint research centre",
    "life-cycle assessment",
    "lifecycle assessment",
    "material",
    "multinational enterprises",
    "multiple capitals framework",
    "national contact points (oecd)",
    "national contact points for responsible business conduct",
    "oecd due diligence guidance for responsible business conduct",
    "own workforce",
    "pollution",
    "renewable energy",
    "science based targets initiative (sbti)",
    "sfdr",
    "stakeholder theory",
    "supply chain transparency",
    "sustainability transformation",
    "sustainable finance disclosure regulation (sfdr)",
    "sustainable resource use",
    "time reserved",
    "union of skills",
    "water and marine resources",
    "whistleblowers",
    "workers in the value chain",
    "working conditions",
    "atmospheric physics",
    "carbon stock",
    "climate models",
    "climate sensitivity",
    "collaborative networks",
    "cyber-physical sensing networks",
    "cyber-physical systems",
    "digital transformation",
    "disaster governance",
    "financial inclusion",
    "greenhouse gas study",
    "industry 4.0",
    "industry 5.0",
    "international human rights law",
    "internet of things",
    "klettner et al., 2014",
    "land use change",
    "marine environment protection committee",
    "multi-agent autonomous fleets",
    "real-time source attribution",
    "refugee law",
    "spatiotemporal graph neural networks",
    "thermodynamics",
    "wced, 1987",
    "bristol green capital partnership",
    "bristol city council",
    "passivhaus",
}

# Short synonyms that do not appear literally in any title or heading.
# Normalised link text → docs-relative target (optionally with #anchor).
MANUAL_ALIASES = {
    "sme": "standards/vsme/index.md",
    "smes": "standards/vsme/index.md",
    "small and medium-sized enterprises": "standards/vsme/index.md",
    "un sdgs": "frameworks/un-sdgs/index.md",
    "sdgs": "frameworks/un-sdgs/index.md",
    "sustainable development goals": "frameworks/un-sdgs/index.md",
    "eu taxonomy": "standards/eu-taxonomy/index.md",
    "ghg protocol": "standards/ghg-protocol/index.md",
    "greenhouse gas protocol": "standards/ghg-protocol/index.md",
    "greenhouse gas protocol (ghg protocol)": "standards/ghg-protocol/index.md",
    "corporate sustainability reporting directive": "standards/csrd/index.md",
    "corporate sustainability reporting directive (csrd)": "standards/csrd/index.md",
    "european sustainability reporting standards": "standards/esrs/index.md",
    "european sustainability reporting standards (esrs)": "standards/esrs/index.md",
    "voluntary sustainability reporting standard for smes": "standards/vsme/index.md",
    "voluntary sustainability reporting standard for smes (vsme)": "standards/vsme/index.md",
    "vsme (voluntary sustainability reporting standard for smes)": "standards/vsme/index.md",
    "vsme standard": "standards/vsme/index.md",
    "task force on climate-related financial disclosures": "frameworks/tcfd/index.md",
    "task force on climate-related financial disclosures (tcfd)": "frameworks/tcfd/index.md",
    "global reporting initiative (gri)": "frameworks/gri/index.md",
    "esrs 1": "standards/esrs/index.md",
    "esrs e1": "standards/esrs/index.md",
    "efrag": "glossary.md#european-financial-reporting-advisory-group",
    "european financial reporting advisory group": "glossary.md#european-financial-reporting-advisory-group",
    "european financial reporting advisory group (efrag)": "glossary.md#european-financial-reporting-advisory-group",
    "issb": "glossary.md#ifrs-s1",
    "international sustainability standards board": "glossary.md#ifrs-s1",
    "ifrs s1": "glossary.md#ifrs-s1",
    "ifrs s2": "glossary.md#ifrs-s2",
    "ifrs s2 climate-related disclosures": "glossary.md#ifrs-s2",
    "scope 1": "glossary.md#scope-1-emissions",
    "scope 2": "glossary.md#scope-2-emissions",
    "scope 3": "glossary.md#scope-3-emissions",
    "scope 1, 2, and 3": "glossary.md#scope-1-emissions",
    "scope 1, 2, and 3 emissions": "glossary.md#scope-1-emissions",
    "materiality assessment": "glossary.md#double-materiality",
    "double materiality assessment": "glossary.md#double-materiality",
}

# Populated by on_config(); normalised link text → docs-relative target.
LINK_INDEX = {}

# Populated by on_config(): KNOWN_EXTERNAL plus any terms listed in
# config/known_external.txt (one per line). Terms here render as plain text without
# a warning. bootstrap.py appends auto-generated external concepts to that file so a
# from-scratch build passes --strict. Edit the file to promote a term to a real link.
RUNTIME_EXTERNAL = set(KNOWN_EXTERNAL)


def _norm(text):
    return re.sub(r"\s+", " ", text).strip().lower()


def _register(index, key, target):
    # First registration wins; callers add higher-priority tiers first.
    index.setdefault(_norm(key), target)


def _read_title(md_text):
    if not md_text.startswith("---"):
        return None
    end = md_text.find("\n---", 3)
    if end == -1:
        return None
    for line in md_text[3:end].splitlines():
        if line.strip().lower().startswith("title:"):
            return line.split(":", 1)[1].strip().strip("\"'")
    return None


def _index_titles(index, docs_dir):
    for md in sorted(Path(docs_dir).rglob("*.md")):
        rel = md.relative_to(docs_dir).as_posix()
        title = _read_title(md.read_text(encoding="utf-8"))
        if not title:
            continue
        _register(index, title, rel)
        if "—" in title:  # "ABBR — Full Name" → register both sides
            abbr, _, full = title.partition("—")
            _register(index, abbr, rel)
            _register(index, full, rel)
        paren = PAREN_RE.match(title)  # "Name (ABBR)" → register name and abbr
        if paren:
            _register(index, paren.group(1), rel)
            _register(index, paren.group(2), rel)


def _index_glossary(index, docs_dir):
    glossary = Path(docs_dir) / "glossary.md"
    if not glossary.exists():
        return
    for heading in HEADING_RE.findall(glossary.read_text(encoding="utf-8")):
        if heading.strip().lower() == "glossary":
            continue
        anchor = "glossary.md#" + slugify(heading, "-")
        _register(index, heading, anchor)
        paren = PAREN_RE.match(heading)
        if paren:
            _register(index, paren.group(1), anchor)  # name without abbr
            _register(index, paren.group(2), anchor)  # abbr alone
        if "/" in heading:  # "IFRS S1 / IFRS S2" → each side
            for part in heading.split("/"):
                _register(index, part, anchor)


def _index_slugs(index, docs_dir):
    """Register each page's slug (folder name for index.md, else file stem) as a
    lowest-priority link target, so e.g. ``[[eu-taxonomy]]`` resolves to that page."""
    for md in sorted(Path(docs_dir).rglob("*.md")):
        rel = md.relative_to(docs_dir).as_posix()
        slug = md.parent.name if md.name == "index.md" else md.stem
        if slug:
            _register(index, slug, rel)


def _load_known_external(docs_dir):
    """KNOWN_EXTERNAL plus normalised terms from config/known_external.txt, if present."""
    ext = set(KNOWN_EXTERNAL)
    kx = Path(docs_dir).parent / "config" / "known_external.txt"
    if kx.exists():
        for line in kx.read_text(encoding="utf-8").splitlines():
            term = _norm(line)
            if term and not term.startswith("#"):
                ext.add(term)
    return ext


def on_config(config, **kwargs):
    """Build the wikilink index once, before any page is rendered."""
    docs_dir = config["docs_dir"]

    # Copy shared assets from kb-framework so they are available at build time.
    # Only write when the content differs: under `mkdocs serve` the docs dir is
    # watched, so an unconditional rewrite touches the file on every build and
    # triggers an endless rebuild loop.
    fw_dir = Path(docs_dir).parent / ".." / "kb-framework"
    local = Path(docs_dir) / "assets" / "javascripts" / "mermaid-toolbar.js"
    source = fw_dir / "assets" / "javascripts" / "mermaid-toolbar.js"
    if source.exists():
        content = source.read_bytes()
        if not local.exists() or local.read_bytes() != content:
            local.parent.mkdir(parents=True, exist_ok=True)
            local.write_bytes(content)
    LINK_INDEX.clear()
    # Priority order (first wins): manual aliases, page titles, glossary terms, slugs.
    for key, target in MANUAL_ALIASES.items():
        _register(LINK_INDEX, key, target)
    _index_titles(LINK_INDEX, docs_dir)
    _index_glossary(LINK_INDEX, docs_dir)
    _index_slugs(LINK_INDEX, docs_dir)
    RUNTIME_EXTERNAL.clear()
    RUNTIME_EXTERNAL.update(_load_known_external(docs_dir))
    log.info("wikilinks: indexed %d link targets", len(LINK_INDEX))
    return config


def _meta_line(meta):
    """Render selected frontmatter as a visible metadata line, or '' if none."""
    parts = []
    if meta.get("content_type"):
        parts.append(f"**Type:** `{meta['content_type']}`")
    domain = meta.get("domain")
    if domain:
        if isinstance(domain, list):
            domain = ", ".join(str(d) for d in domain)
        parts.append(f"**Domain:** `{domain}`")
    if meta.get("status"):
        parts.append(f"**Status:** `{meta['status']}`")
    return " · ".join(parts)


def _inject_meta(markdown, meta):
    """Insert a metadata line (and a banner for generated pages) below the H1."""
    block = []
    if meta.get("generated"):
        block += [
            '!!! warning "Generated page"',
            "    This page is generated from its source articles and is "
            "regenerated automatically. Edits made here are overwritten — "
            "change the source pages or the synthesis configuration instead.",
            "",
        ]
    line = _meta_line(meta)
    if line:
        block.append(line)
    if not block:
        return markdown
    out, injected = [], False
    for row in markdown.splitlines():
        out.append(row)
        if not injected and row.startswith("# "):
            out.append("")
            out.extend(block)
            injected = True
    return "\n".join(out) if injected else markdown


def on_page_markdown(markdown, page, config, **kwargs):
    src = page.file.src_path.replace("\\", "/")
    current_dir = PurePosixPath(src).parent
    markdown = _inject_meta(markdown, page.meta or {})

    def replace(match):
        # Inside Markdown tables the alias pipe is escaped as ``\|``; strip a
        # trailing backslash so ``[[Target\|Alias]]`` resolves like ``[[Target|Alias]]``.
        link_key = match.group(1).strip().rstrip("\\")
        display = (match.group(2) or link_key).strip()
        target = LINK_INDEX.get(_norm(link_key))
        if not target:
            if _norm(link_key) not in RUNTIME_EXTERNAL:
                log.warning("wikilinks: unresolved [[%s]] in %s", link_key, src)
            return display  # plain text, no broken anchor
        path, _, anchor = target.partition("#")
        rel = os.path.relpath(path, str(current_dir)).replace("\\", "/")
        return f"[{display}]({rel}#{anchor})" if anchor else f"[{display}]({rel})"

    return WIKILINK_RE.sub(replace, markdown)
