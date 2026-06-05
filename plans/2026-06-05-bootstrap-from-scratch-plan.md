# Bootstrap (from-scratch wiki build) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an explicit `bootstrap` operation that rebuilds a structured wiki from a folder of PDFs, using the existing `mkdocs.yml` nav as the blueprint, ending in a passing strict build — without changing everyday `ingest`.

**Architecture:** New `kb-framework/pipeline/bootstrap.py` orchestrator + `agents/splitter.md`. It reuses ingest's helpers (`extract_markdown`, `wikipedia-style`/`domain-merge`/`tagger` agents, `enrich_glossary`, `determine_output_path`, `_update_nav`) and `query.py` (models/cross-ref/synthesis/catalog). The domain tag→path map moves from a hardcoded dict in `ingest.py` to a `domains:` block in `config/kb.yaml`.

**Tech Stack:** Python 3.8+, PyYAML, `anthropic` (only at runtime, monkeypatched in tests), pytest 9.x, MkDocs + Material.

**Spec:** `EurSuRA-kb/specs/2026-06-05-bootstrap-from-scratch-design.md`

**Absolute paths:** engine `M:/KnowledgeBase/kb-framework`, instance `M:/KnowledgeBase/EurSuRA-kb`.

**Conventions (every task):**
- Engine code/tests/commits in `kb-framework`; instance config/docs/commits in `EurSuRA-kb`.
- Tests run with `python -m pytest` from `M:/KnowledgeBase/kb-framework`; reuse the existing `tests/conftest.py` (puts `pipeline/` on `sys.path`).
- Windows cp1252 console — **ASCII only** in `print()`/output.
- End each commit message with a blank line then `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`.
- Per the project rule: if a change is README-worthy, update the relevant README in the same commit (Task 9 covers the README updates explicitly).

---

## File Structure

**Created:**
- `M:/KnowledgeBase/kb-framework/pipeline/bootstrap.py` — orchestrator + CLI (`--kb`, `--clean`).
- `M:/KnowledgeBase/kb-framework/agents/splitter.md` — splitter system prompt.
- `M:/KnowledgeBase/kb-framework/tests/test_bootstrap.py` — unit + integration tests.

**Modified:**
- `M:/KnowledgeBase/kb-framework/pipeline/ingest.py` — remove `DOMAIN_INDEX`; `domain_index_path` takes a `domain_map`; `enrich_glossary` seeds an empty glossary; `ingest_pdf` reads the map from `kb_config`.
- `M:/KnowledgeBase/EurSuRA-kb/config/kb.yaml` — add `domains:` map.
- `M:/KnowledgeBase/kb-framework/README.md` and `M:/KnowledgeBase/EurSuRA-kb/README.md` — document bootstrap.

---

## Task 1: Move the domain map to config (ingest.py)

**Files:**
- Modify: `M:/KnowledgeBase/kb-framework/pipeline/ingest.py`
- Test: `M:/KnowledgeBase/kb-framework/tests/test_bootstrap.py`

- [ ] **Step 1: Write the failing test**

```python
# M:/KnowledgeBase/kb-framework/tests/test_bootstrap.py
from pathlib import Path

import yaml

import ingest


def test_domain_index_path_uses_config_map(tmp_path: Path):
    docs = tmp_path / "docs"
    dmap = {"ESRS": "standards/esrs/index.md", "GRI": "frameworks/gri/index.md"}
    fm = {"content_type": "standard", "domain": ["ESRS"]}
    assert ingest.domain_index_path(docs, fm, dmap) == docs / "standards/esrs/index.md"
    # Non-mergeable type -> None
    assert ingest.domain_index_path(docs, {"content_type": "report", "domain": ["ESRS"]}, dmap) is None
    # Unknown domain -> None
    assert ingest.domain_index_path(docs, {"content_type": "framework", "domain": ["XYZ"]}, dmap) is None
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd M:/KnowledgeBase/kb-framework && python -m pytest tests/test_bootstrap.py::test_domain_index_path_uses_config_map -q`
Expected: FAIL — `domain_index_path` currently takes 2 args (TypeError) / still references global `DOMAIN_INDEX`.

- [ ] **Step 3: Implement**

In `ingest.py`, delete the `DOMAIN_INDEX = { ... }` dict. Change `domain_index_path` to:

```python
def domain_index_path(docs_root: Path, frontmatter: dict, domain_map: dict):
    """The canonical index.md a mergeable article should fold into, or None."""
    if frontmatter.get("content_type") not in MERGEABLE_TYPES:
        return None
    for d in frontmatter.get("domain", []) or []:
        rel = domain_map.get(str(d).upper())
        if rel:
            return docs_root / rel
    return None
```

In `ingest_pdf`, just before the existing `target_index = domain_index_path(...)` call, build the map from the config it already receives and pass it:

```python
        domain_map = {k.upper(): v for k, v in (kb_config.get("domains") or {}).items()}
        target_index = domain_index_path(paths["docs"], frontmatter, domain_map)
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd M:/KnowledgeBase/kb-framework && python -m pytest tests/test_bootstrap.py::test_domain_index_path_uses_config_map -q`
Expected: PASS (1 passed).

- [ ] **Step 5: Confirm nothing else referenced `DOMAIN_INDEX`**

Run: `cd M:/KnowledgeBase/kb-framework && python -c "print('DOMAIN_INDEX' in open('pipeline/ingest.py',encoding='utf-8').read())"`
Expected: `False`. Then `python -m py_compile pipeline/ingest.py && echo OK` → `OK`.

- [ ] **Step 6: Commit**

```bash
cd M:/KnowledgeBase/kb-framework
git add pipeline/ingest.py tests/test_bootstrap.py
git commit -m "refactor(ingest): read domain tag->path map from config, drop hardcoded DOMAIN_INDEX"
```

## Task 2: Seed an empty glossary (ingest.py)

**Files:**
- Modify: `M:/KnowledgeBase/kb-framework/pipeline/ingest.py` (`enrich_glossary`)
- Test: `M:/KnowledgeBase/kb-framework/tests/test_bootstrap.py`

- [ ] **Step 1: Add the failing test**

```python
def test_enrich_glossary_seeds_when_absent(tmp_path: Path, monkeypatch):
    docs = tmp_path / "docs"; docs.mkdir()
    (tmp_path / "logs").mkdir()
    paths = {"docs": docs, "logs": tmp_path / "logs"}
    # term-enricher returns one entry; framework_path unused because call_claude is patched.
    monkeypatch.setattr(ingest, "call_claude", lambda *a, **k: "### Double Materiality\nImpact and financial.\n")
    monkeypatch.setattr(ingest, "load_agent_prompt", lambda *a, **k: "PROMPT")
    ingest.enrich_glossary(paths, tmp_path, "article", "meta", paths["logs"] / "enrich.log")
    g = (docs / "glossary.md").read_text(encoding="utf-8")
    assert "# Glossary" in g and "Double Materiality" in g
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd M:/KnowledgeBase/kb-framework && python -m pytest tests/test_bootstrap.py::test_enrich_glossary_seeds_when_absent -q`
Expected: FAIL — current code returns early when `glossary.md` is absent, so the file is never created (`FileNotFoundError`).

- [ ] **Step 3: Implement**

In `ingest.py`, find the start of `enrich_glossary`:

```python
    glossary = paths["docs"] / "glossary.md"
    if not glossary.exists():
        return
```

Replace those three lines with a seed-then-continue:

```python
    glossary = paths["docs"] / "glossary.md"
    if not glossary.exists():
        glossary.parent.mkdir(parents=True, exist_ok=True)
        glossary.write_text("---\ntitle: Glossary\n---\n\n# Glossary\n\n", encoding="utf-8")
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd M:/KnowledgeBase/kb-framework && python -m pytest tests/test_bootstrap.py -q`
Expected: PASS (2 passed).

- [ ] **Step 5: Commit**

```bash
cd M:/KnowledgeBase/kb-framework
git add pipeline/ingest.py tests/test_bootstrap.py
git commit -m "feat(ingest): seed an empty glossary.md instead of skipping when absent"
```

## Task 3: Splitter agent + output parser

**Files:**
- Create: `M:/KnowledgeBase/kb-framework/agents/splitter.md`
- Create: `M:/KnowledgeBase/kb-framework/pipeline/bootstrap.py`
- Test: `M:/KnowledgeBase/kb-framework/tests/test_bootstrap.py`

- [ ] **Step 1: Create the agent prompt** — `agents/splitter.md`:

```markdown
# Splitter agent

System prompt used by `pipeline/bootstrap.py` to fan one source across the
knowledge-base domains it substantively covers.

```
You are organising a source document into a sustainability-reporting knowledge
base. You are given the article text and a list of KNOWN DOMAINS (tags). For each
domain the document SUBSTANTIVELY covers (not just mentions in passing), output a
section in exactly this format:

## DOMAIN: <TAG>
<one to four paragraphs of encyclopaedic prose about that domain, drawn only from
the document>

Use the exact tag from the KNOWN DOMAINS list. Omit domains the document does not
materially cover. If the document is not substantively about any known domain,
output nothing.
```
```

- [ ] **Step 2: Add the failing test**

```python
import bootstrap


def test_parse_splitter_output_keeps_known_domains_only():
    text = (
        "## DOMAIN: ESRS\nESRS prose here.\n\n"
        "## DOMAIN: XYZ\nUnknown domain, ignore.\n\n"
        "## DOMAIN: GRI\nGRI prose here.\n"
    )
    blocks = bootstrap.parse_splitter_output(text, ["ESRS", "GRI", "TCFD"])
    assert set(blocks) == {"ESRS", "GRI"}
    assert blocks["ESRS"].startswith("ESRS prose")
    assert "Unknown" not in "".join(blocks.values())


def test_parse_splitter_output_empty_when_no_sections():
    assert bootstrap.parse_splitter_output("nothing here", ["ESRS"]) == {}
```

- [ ] **Step 3: Run test to verify it fails**

Run: `cd M:/KnowledgeBase/kb-framework && python -m pytest tests/test_bootstrap.py::test_parse_splitter_output_keeps_known_domains_only -q`
Expected: FAIL — `ModuleNotFoundError: No module named 'bootstrap'`.

- [ ] **Step 4: Create `pipeline/bootstrap.py` with the parser**

```python
"""Bootstrap: build a structured wiki from a folder of PDFs.

Uses the existing mkdocs.yml nav as the blueprint and the config `domains:` map.
Reuses ingest.py helpers and query.py regeneration. Everyday ingest is unchanged.

Usage:
    python bootstrap.py --kb <path> [--clean]
"""

import re
import sys
import shutil
import datetime
import argparse
import subprocess
from pathlib import Path

import yaml

from ingest import (
    resolve_paths, log, extract_markdown, load_agent_prompt, call_claude,
    split_frontmatter, merge_into_domain, merge_frontmatter, determine_output_path,
    enrich_glossary, _update_nav, _append_changelog,
)

SECTION_RE = re.compile(r"^##\s*DOMAIN:\s*(.+?)\s*$", re.MULTILINE)


def parse_splitter_output(text: str, known_tags) -> dict:
    """{TAG: prose} for each `## DOMAIN: TAG` section whose tag is known and body non-empty."""
    known = {str(t).upper() for t in known_tags}
    matches = list(SECTION_RE.finditer(text))
    blocks = {}
    for i, m in enumerate(matches):
        tag = m.group(1).strip().upper()
        start = m.end()
        end = matches[i + 1].start() if i + 1 < len(matches) else len(text)
        body = text[start:end].strip()
        if tag in known and body:
            blocks[tag] = body
    return blocks
```

- [ ] **Step 5: Run test to verify it passes**

Run: `cd M:/KnowledgeBase/kb-framework && python -m pytest tests/test_bootstrap.py -q`
Expected: PASS (4 passed).

- [ ] **Step 6: Commit**

```bash
cd M:/KnowledgeBase/kb-framework
git add agents/splitter.md pipeline/bootstrap.py tests/test_bootstrap.py
git commit -m "feat(bootstrap): splitter agent + parse_splitter_output"
```

## Task 4: Nav blueprint parsing + stub scaffolding

**Files:**
- Modify: `M:/KnowledgeBase/kb-framework/pipeline/bootstrap.py`
- Test: `M:/KnowledgeBase/kb-framework/tests/test_bootstrap.py`

- [ ] **Step 1: Add the failing test**

```python
def test_parse_nav_and_scaffold(tmp_path: Path):
    (tmp_path / "mkdocs.yml").write_text(
        "site_name: T\nnav:\n"
        "  - Home: index.md\n"
        "  - Standards:\n"
        "    - ESRS: standards/esrs/index.md\n"
        "  - Glossary: glossary.md\n", encoding="utf-8")
    docs = tmp_path / "docs"; docs.mkdir()
    (docs / "glossary.md").write_text("---\ntitle: Glossary\n---\n\n# Glossary\n", encoding="utf-8")

    pairs = bootstrap.parse_nav(tmp_path / "mkdocs.yml")
    assert ("ESRS", "standards/esrs/index.md") in pairs
    assert ("Home", "index.md") in pairs

    created = bootstrap.scaffold_missing(tmp_path)
    # index.md and standards/esrs/index.md were missing; glossary.md existed.
    assert "index.md" in created and "standards/esrs/index.md" in created
    assert "glossary.md" not in created
    stub = (docs / "standards/esrs/index.md").read_text(encoding="utf-8")
    assert "title: ESRS" in stub and "# ESRS" in stub
    assert "[[" not in stub  # stubs must not contain unresolved wikilinks
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd M:/KnowledgeBase/kb-framework && python -m pytest tests/test_bootstrap.py::test_parse_nav_and_scaffold -q`
Expected: FAIL — `AttributeError: module 'bootstrap' has no attribute 'parse_nav'`.

- [ ] **Step 3: Implement** — add to `bootstrap.py`:

```python
def parse_nav(mkdocs_yml: Path) -> list:
    """[(label, rel_path)] for every page in the nav; label is the nearest dict key."""
    cfg = yaml.safe_load(mkdocs_yml.read_text(encoding="utf-8")) or {}
    pairs = []

    def walk(node, label=None):
        if isinstance(node, str):
            pairs.append((label or node, node))
        elif isinstance(node, list):
            for item in node:
                walk(item, label)
        elif isinstance(node, dict):
            for key, value in node.items():
                walk(value, key)

    walk(cfg.get("nav", []))
    return pairs


def scaffold_missing(kb_root: Path) -> list:
    """Write a minimal valid stub for any nav page with no file. Never overwrites."""
    docs = kb_root / "docs"
    created = []
    for label, rel in parse_nav(kb_root / "mkdocs.yml"):
        page = docs / rel
        if page.exists():
            continue
        page.parent.mkdir(parents=True, exist_ok=True)
        page.write_text(
            f"---\ntitle: {label}\nstatus: draft\n---\n\n# {label}\n\n"
            "*Placeholder page scaffolded by bootstrap. Ingest sources to fill it.*\n",
            encoding="utf-8")
        created.append(rel)
    return created
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd M:/KnowledgeBase/kb-framework && python -m pytest tests/test_bootstrap.py -q`
Expected: PASS (6 passed).

- [ ] **Step 5: Commit**

```bash
cd M:/KnowledgeBase/kb-framework
git add pipeline/bootstrap.py tests/test_bootstrap.py
git commit -m "feat(bootstrap): nav blueprint parsing and stub scaffolding"
```

## Task 5: `--clean` docs reset

**Files:**
- Modify: `M:/KnowledgeBase/kb-framework/pipeline/bootstrap.py`
- Test: `M:/KnowledgeBase/kb-framework/tests/test_bootstrap.py`

- [ ] **Step 1: Add the failing test**

```python
def test_clean_docs_removes_md_and_json(tmp_path: Path):
    docs = tmp_path / "docs" / "standards" / "esrs"
    docs.mkdir(parents=True)
    (tmp_path / "docs" / "index.md").write_text("x", encoding="utf-8")
    (docs / "index.md").write_text("x", encoding="utf-8")
    (tmp_path / "docs" / "catalog.json").write_text("[]", encoding="utf-8")
    removed = bootstrap.clean_docs(tmp_path)
    assert removed == 3
    assert list((tmp_path / "docs").rglob("*.md")) == []
    assert list((tmp_path / "docs").rglob("*.json")) == []
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd M:/KnowledgeBase/kb-framework && python -m pytest tests/test_bootstrap.py::test_clean_docs_removes_md_and_json -q`
Expected: FAIL — `AttributeError: module 'bootstrap' has no attribute 'clean_docs'`.

- [ ] **Step 3: Implement** — add to `bootstrap.py`:

```python
def clean_docs(kb_root: Path) -> int:
    """Delete all markdown and json under docs/ (keeps directories and mkdocs.yml)."""
    docs = kb_root / "docs"
    removed = 0
    for pattern in ("*.md", "*.json"):
        for page in docs.rglob(pattern):
            page.unlink()
            removed += 1
    return removed
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd M:/KnowledgeBase/kb-framework && python -m pytest tests/test_bootstrap.py -q`
Expected: PASS (7 passed).

- [ ] **Step 5: Commit**

```bash
cd M:/KnowledgeBase/kb-framework
git add pipeline/bootstrap.py tests/test_bootstrap.py
git commit -m "feat(bootstrap): --clean docs reset helper"
```

## Task 6: Per-source routing (`_bootstrap_one`)

**Files:**
- Modify: `M:/KnowledgeBase/kb-framework/pipeline/bootstrap.py`
- Test: `M:/KnowledgeBase/kb-framework/tests/test_bootstrap.py`

This routes one source: splitter blocks → merge into domain pages (create fresh if absent); if no blocks, write a standalone report. `call_claude` is monkeypatched in tests so no API is used.

- [ ] **Step 1: Add the failing test**

```python
# Shared fakes. load_agent_prompt is patched to return the agent NAME, so call_claude
# can dispatch deterministically by name (robust to agent-prompt wording changes).
def _fake_prompt(framework_path, agent_name):
    return agent_name


def _fake_claude(system_prompt, user_content, **kw):
    return {
        "splitter": "## DOMAIN: ESRS\nESRS prose from the source.\n",
        "wikipedia-style": "Wikipedia-style article body about ESRS.",
        "domain-merge": "MERGED ESRS BODY",
        "tagger": "content_type: report\ntitle: A Report\ndomain: []\n",
        "term-enricher": "### Double Materiality\nImpact and financial.\n",
    }.get(system_prompt, "")


def _patch_llm(monkeypatch):
    """Patch call_claude + load_agent_prompt in BOTH modules (ingest helpers call ingest's)."""
    import ingest
    monkeypatch.setattr(bootstrap, "call_claude", _fake_claude)
    monkeypatch.setattr(bootstrap, "load_agent_prompt", _fake_prompt)
    monkeypatch.setattr(ingest, "call_claude", _fake_claude)
    monkeypatch.setattr(ingest, "load_agent_prompt", _fake_prompt)


def test_bootstrap_one_merges_domain_block(tmp_path: Path, monkeypatch):
    fw = Path(__file__).resolve().parents[1]            # real kb-framework
    docs = tmp_path / "docs"; (tmp_path / "logs").mkdir(); (tmp_path / "config").mkdir()
    (tmp_path / "pipeline" / "processed").mkdir(parents=True); docs.mkdir()
    pdf = tmp_path / "pipeline" / "inbox" / "src.pdf"
    pdf.parent.mkdir(parents=True); pdf.write_bytes(b"%PDF-1.4 fake")
    paths = bootstrap.resolve_paths(tmp_path)

    monkeypatch.setattr(bootstrap, "extract_markdown", lambda p: "raw text")
    _patch_llm(monkeypatch)
    domain_map = {"ESRS": "standards/esrs/index.md"}
    merged = bootstrap._bootstrap_one(
        pdf, paths, fw, {"domains": domain_map},
        domain_map=domain_map, nav_paths={"standards/esrs/index.md"},
        label_by_path={"standards/esrs/index.md": "ESRS"})

    page = docs / "standards/esrs/index.md"
    assert page.exists()
    assert "content_type: standard" in page.read_text(encoding="utf-8")
    assert merged is True
    assert (tmp_path / "pipeline" / "processed" / "src.pdf").exists()  # moved


def test_bootstrap_one_report_fallback(tmp_path: Path, monkeypatch):
    fw = Path(__file__).resolve().parents[1]
    docs = tmp_path / "docs"; (tmp_path / "logs").mkdir(); (tmp_path / "config").mkdir()
    (tmp_path / "pipeline" / "processed").mkdir(parents=True); docs.mkdir()
    pdf = tmp_path / "pipeline" / "inbox" / "rep.pdf"
    pdf.parent.mkdir(parents=True); pdf.write_bytes(b"%PDF-1.4 fake")
    (tmp_path / "mkdocs.yml").write_text("site_name: T\nnav: []\n", encoding="utf-8")
    paths = bootstrap.resolve_paths(tmp_path)

    monkeypatch.setattr(bootstrap, "extract_markdown", lambda p: "raw")
    _patch_llm(monkeypatch)
    # Empty domain_map => splitter blocks are all filtered out => report fallback.
    merged = bootstrap._bootstrap_one(
        pdf, paths, fw, {"domains": {}},
        domain_map={}, nav_paths=set(), label_by_path={})
    assert merged is False
    assert list((docs / "reports").rglob("*.md"))  # a report page was written
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd M:/KnowledgeBase/kb-framework && python -m pytest tests/test_bootstrap.py::test_bootstrap_one_merges_domain_block -q`
Expected: FAIL — `AttributeError: module 'bootstrap' has no attribute '_bootstrap_one'`.

- [ ] **Step 3: Implement** — add to `bootstrap.py`:

```python
def _new_domain_frontmatter(rel: str, tag: str, label: str, pdf_name: str) -> dict:
    today = datetime.date.today().isoformat()
    ctype = "standard" if rel.startswith("standards/") else "framework"
    return {
        "title": label or tag, "content_type": ctype, "domain": [tag],
        "status": "draft", "date_added": today, "date_updated": today,
        "source_file": pdf_name, "sources": [pdf_name],
    }


def _write(out_path: Path, frontmatter: dict, body: str) -> None:
    out_path.parent.mkdir(parents=True, exist_ok=True)
    fm = "---\n" + yaml.dump(frontmatter, allow_unicode=True, sort_keys=False) + "---\n\n"
    out_path.write_text(fm + body, encoding="utf-8")


def _bootstrap_one(pdf, paths, framework_path, kb_config,
                   domain_map, nav_paths, label_by_path) -> bool:
    """Process one PDF. Returns True if it merged into >=1 domain page, else False (report)."""
    ingest_log = paths["logs"] / "ingestion.log"
    enrich_log = paths["logs"] / "enrichment.log"
    raw = extract_markdown(pdf)
    source_meta = (f"Source file: {pdf.name}\n"
                   f"Source body: {kb_config.get('default_source_body', 'Unknown')}\n"
                   f"Date: {datetime.date.today().isoformat()}")
    article = call_claude(load_agent_prompt(framework_path, "wikipedia-style"),
                          f"{source_meta}\n\n---\n\n{raw[:12000]}")

    split = call_claude(load_agent_prompt(framework_path, "splitter"),
                        f"KNOWN DOMAINS: {', '.join(domain_map) or '(none)'}\n\n---\n\n{article[:12000]}")
    blocks = parse_splitter_output(split, domain_map.keys())

    merged_any = False
    for tag, prose in blocks.items():
        rel = domain_map[tag]
        if rel not in nav_paths:
            log(enrich_log, "WARN", f"BOOTSTRAP {pdf.name}: domain '{tag}' path '{rel}' not in nav; skipping")
            continue
        target = paths["docs"] / rel
        if target.exists():
            efm, ebody = split_frontmatter(target.read_text(encoding="utf-8"))
            body = merge_into_domain(framework_path, ebody, prose, source_meta)
            fm = merge_frontmatter(efm, {"domain": [tag]}, pdf.name)
        else:
            body = prose
            fm = _new_domain_frontmatter(rel, tag, label_by_path.get(rel, tag), pdf.name)
        _write(target, fm, body)
        log(ingest_log, "INFO", f"BOOTSTRAP_MERGED {pdf.name} -> {rel}")
        merged_any = True

    if not merged_any:
        # Standalone report: tag, then write to determine_output_path.
        tag_yaml = call_claude(load_agent_prompt(framework_path, "tagger"),
                               f"{source_meta}\n\n---\n\n{article[:6000]}").strip().lstrip("-").strip()
        try:
            frontmatter = yaml.safe_load(tag_yaml) or {}
        except yaml.YAMLError:
            frontmatter = {}
        frontmatter.setdefault("content_type", "report")
        frontmatter["date_added"] = frontmatter["date_updated"] = datetime.date.today().isoformat()
        frontmatter["source_file"] = pdf.name
        source_name = pdf.stem.lower().replace(" ", "-")
        out_path = determine_output_path(paths["docs"], frontmatter, source_name)
        _write(out_path, frontmatter, article)
        mkdocs_yml = paths["docs"].parent / "mkdocs.yml"
        if mkdocs_yml.exists():
            _update_nav(mkdocs_yml, out_path, paths["docs"],
                        frontmatter.get("title", source_name), frontmatter)
        log(ingest_log, "INFO", f"BOOTSTRAP_REPORT {pdf.name} -> {out_path.relative_to(paths['docs'])}")

    try:
        enrich_glossary(paths, framework_path, article, source_meta, enrich_log)
    except Exception as exc:
        log(enrich_log, "WARN", f"GLOSSARY_SKIP {pdf.name}: {exc}")

    shutil.move(str(pdf), str(paths["processed"] / pdf.name))
    _append_changelog(changelog=paths["logs"].parent / "CHANGELOG.md", pdf_name=pdf.name,
                      out_path=(paths["docs"] / "glossary.md"), docs_root=paths["docs"],
                      frontmatter={"title": pdf.stem, "domain": list(blocks)})
    return merged_any
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd M:/KnowledgeBase/kb-framework && python -m pytest tests/test_bootstrap.py -q`
Expected: PASS (9 passed).

- [ ] **Step 5: Commit**

```bash
cd M:/KnowledgeBase/kb-framework
git add pipeline/bootstrap.py tests/test_bootstrap.py
git commit -m "feat(bootstrap): per-source domain routing with report fallback"
```

## Task 7: Orchestrator + CLI (`run_bootstrap`, `main`)

**Files:**
- Modify: `M:/KnowledgeBase/kb-framework/pipeline/bootstrap.py`
- Test: `M:/KnowledgeBase/kb-framework/tests/test_bootstrap.py`

- [ ] **Step 1: Add the failing integration test** (monkeypatched LLM + real strict build)

```python
def test_run_bootstrap_end_to_end_strict_build(tmp_path: Path, monkeypatch):
    fw = Path(__file__).resolve().parents[1]
    # Minimal KB: nav lists Home, ESRS, Glossary; empty docs; one PDF in inbox.
    (tmp_path / "config").mkdir(); (tmp_path / "logs").mkdir(); (tmp_path / "docs").mkdir()
    (tmp_path / "pipeline" / "inbox").mkdir(parents=True)
    (tmp_path / "pipeline" / "processed").mkdir(parents=True)
    (tmp_path / "pipeline" / "failed").mkdir(parents=True)
    (tmp_path / "pipeline" / "inbox" / "src.pdf").write_bytes(b"%PDF-1.4 fake")
    (tmp_path / "config" / "kb.yaml").write_text(
        "name: t\nframework_path: " + fw.as_posix() + "\n"
        "domains:\n  ESRS: standards/esrs/index.md\n", encoding="utf-8")
    (tmp_path / "mkdocs.yml").write_text(
        "site_name: T\ndocs_dir: docs\nsite_dir: site\nplugins: [search]\nnav:\n"
        "  - Home: index.md\n  - ESRS: standards/esrs/index.md\n  - Glossary: glossary.md\n",
        encoding="utf-8")

    monkeypatch.setattr(bootstrap, "extract_markdown", lambda p: "raw text")
    _patch_llm(monkeypatch)
    # Skip the heavy query.py regeneration subprocess and the rebuild subprocess in the unit test.
    monkeypatch.setattr(bootstrap, "_regenerate", lambda *a, **k: None)
    monkeypatch.setattr(bootstrap, "_rebuild", lambda *a, **k: None)

    kb_cfg = yaml.safe_load((tmp_path / "config" / "kb.yaml").read_text(encoding="utf-8"))
    bootstrap.run_bootstrap(tmp_path, fw, kb_cfg, clean=True)

    # ESRS page filled from the domain block; Home + Glossary scaffolded/seeded.
    assert (tmp_path / "docs" / "standards/esrs/index.md").exists()
    assert (tmp_path / "docs" / "index.md").exists()           # scaffolded stub
    assert (tmp_path / "docs" / "glossary.md").exists()         # seeded by enrich_glossary
    # Strict build must pass on the produced structure.
    import subprocess, sys
    r = subprocess.run([sys.executable, "-m", "mkdocs", "build",
                        "--config-file", str(tmp_path / "mkdocs.yml"), "--strict"],
                       capture_output=True, text=True, cwd=str(tmp_path))
    assert r.returncode == 0, r.stdout + r.stderr
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd M:/KnowledgeBase/kb-framework && python -m pytest tests/test_bootstrap.py::test_run_bootstrap_end_to_end_strict_build -q`
Expected: FAIL — `AttributeError: module 'bootstrap' has no attribute 'run_bootstrap'`.

- [ ] **Step 3: Implement** — add to `bootstrap.py`:

```python
def _regenerate(kb_root: Path, framework_path: Path) -> None:
    """Regenerate models (3), cross-ref, synthesis, catalog via query.py subprocesses."""
    query = framework_path / "pipeline" / "query.py"
    for model in ("semantic-model", "concept-map", "ontology"):
        subprocess.run([sys.executable, str(query), "--kb", str(kb_root), "--model", model])
    subprocess.run([sys.executable, str(query), "--kb", str(kb_root),
                    "--cross-ref", "--synthesis", "--catalog"])


def _rebuild(kb_root: Path, framework_path: Path) -> None:
    rebuild = framework_path / "pipeline" / "rebuild.py"
    if rebuild.exists():
        subprocess.run([sys.executable, str(rebuild), "--kb", str(kb_root)])


def run_bootstrap(kb_root: Path, framework_path: Path, kb_config: dict, clean: bool = False):
    paths = resolve_paths(kb_root)
    ingest_log = paths["logs"] / "ingestion.log"
    paths["logs"].mkdir(parents=True, exist_ok=True)
    if clean:
        removed = clean_docs(kb_root)
        log(ingest_log, "INFO", f"BOOTSTRAP_CLEAN removed {removed} files")

    nav_pairs = parse_nav(kb_root / "mkdocs.yml")
    nav_paths = {rel for _, rel in nav_pairs}
    label_by_path = {rel: label for label, rel in nav_pairs}
    domain_map = {k.upper(): v for k, v in (kb_config.get("domains") or {}).items()}

    pdfs = sorted(paths["inbox"].glob("*.pdf"))
    for pdf in pdfs:
        try:
            _bootstrap_one(pdf, paths, framework_path, kb_config,
                           domain_map, nav_paths, label_by_path)
        except Exception as exc:
            log(ingest_log, "ERROR", f"BOOTSTRAP_FAILED {pdf.name}: {exc}")
            try:
                shutil.move(str(pdf), str(paths["failed"] / pdf.name))
            except Exception:
                pass

    _regenerate(kb_root, framework_path)
    created = scaffold_missing(kb_root)
    if created:
        log(ingest_log, "INFO", f"BOOTSTRAP_SCAFFOLD {len(created)} stub pages")
    _rebuild(kb_root, framework_path)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--kb", required=True)
    parser.add_argument("--clean", action="store_true",
                        help="Delete docs/**/*.md and *.json before building (true from-scratch)")
    args = parser.parse_args()
    kb_root = Path(args.kb).resolve()
    cfg_file = kb_root / "config" / "kb.yaml"
    kb_config = yaml.safe_load(cfg_file.read_text(encoding="utf-8")) if cfg_file.exists() else {}
    fw_raw = (kb_config or {}).get("framework_path", "../kb-framework")
    framework_path = (kb_root / fw_raw).resolve()
    run_bootstrap(kb_root, framework_path, kb_config or {}, clean=args.clean)


if __name__ == "__main__":
    main()
```

- [ ] **Step 4: Run the full test file**

Run: `cd M:/KnowledgeBase/kb-framework && python -m pytest tests/test_bootstrap.py -q`
Expected: PASS (10 passed).

- [ ] **Step 5: Full engine suite stays green**

Run: `cd M:/KnowledgeBase/kb-framework && python -m pytest -q`
Expected: all pass (14 prior + 10 bootstrap = 24).

- [ ] **Step 6: Commit**

```bash
cd M:/KnowledgeBase/kb-framework
git add pipeline/bootstrap.py tests/test_bootstrap.py
git commit -m "feat(bootstrap): orchestrator + CLI (run_bootstrap, --clean)"
```

## Task 8: Instance config — `domains:` in kb.yaml

**Files:**
- Modify: `M:/KnowledgeBase/EurSuRA-kb/config/kb.yaml`

- [ ] **Step 1: Add the domains map** (append):

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

- [ ] **Step 2: Verify it parses and everyday ingest still resolves domains**

Run: `cd M:/KnowledgeBase/EurSuRA-kb && python -c "import yaml; d=yaml.safe_load(open('config/kb.yaml',encoding='utf-8'))['domains']; print(sorted(d)); assert d['ESRS']=='standards/esrs/index.md'"`
Expected: prints the 8 tags; no assertion error.

- [ ] **Step 3: Commit**

```bash
cd M:/KnowledgeBase/EurSuRA-kb
git add config/kb.yaml
git commit -m "feat(bootstrap): declare domain tag->path map in kb.yaml"
```

## Task 9: Documentation (both READMEs)

**Files:**
- Modify: `M:/KnowledgeBase/kb-framework/README.md`
- Modify: `M:/KnowledgeBase/EurSuRA-kb/README.md`

- [ ] **Step 1: kb-framework README** — add to the Agents table a `splitter.md` row, and to the Pipeline Scripts table a `bootstrap.py` row:

```markdown
| [`splitter.md`](agents/splitter.md) | Fans one source across the domains it substantively covers (`bootstrap.py`) |
```
```markdown
| [`bootstrap.py`](pipeline/bootstrap.py) | Build a structured wiki from scratch toward the mkdocs.yml nav blueprint (`--clean` for a true reset) |
```

- [ ] **Step 2: EurSuRA README** — add a section after "Quality checks (lint)":

```markdown
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
```

- [ ] **Step 3: Verify referenced files exist**

Run: `cd M:/KnowledgeBase/kb-framework && python -c "import pathlib; miss=[f for f in ['agents/splitter.md','pipeline/bootstrap.py'] if not pathlib.Path(f).exists()]; print('MISSING',miss) if miss else print('ok')"`
Expected: `ok`.

- [ ] **Step 4: Commit (one per repo)**

```bash
cd M:/KnowledgeBase/kb-framework && git add README.md && git commit -m "docs: document bootstrap.py and the splitter agent"
cd M:/KnowledgeBase/EurSuRA-kb && git add README.md && git commit -m "docs(readme): document from-scratch bootstrap"
```

## Task 10: Manual end-to-end (with API key) + cleanup

**Files:** none (verification only).

- [ ] **Step 1: Bootstrap the 5 PDFs into a fresh scratch copy**

Recreate the scratch sibling, copy `config/`, `mkdocs.yml`, `hooks.py`, `.env`, `requirements`, and the 5 PDFs into `pipeline/inbox/`, with an empty `docs/`. Then:

Run: `cd M:/KnowledgeBase/_scratch-rebuild && python ../kb-framework/pipeline/bootstrap.py --kb . --clean`
Expected: PDFs processed; domain pages created for substantive domains; glossary populated; models/insights/catalog regenerated; stubs for the rest.

- [ ] **Step 2: Confirm the strict build passes**

Run: `cd M:/KnowledgeBase/_scratch-rebuild && python -m mkdocs build --config-file mkdocs.yml --strict 2>&1 | tail -3`
Expected: "Documentation built" with **no** "nav reference not found" or unresolved-wikilink warnings (exit 0).

- [ ] **Step 3: Report the page inventory vs the nav blueprint** (how close to the 24-page structure), then remove the scratch dir.

Run: `rm -rf M:/KnowledgeBase/_scratch-rebuild`

- [ ] **Step 4: Push + close** — only on explicit user approval:

```bash
cd M:/KnowledgeBase/kb-framework && git push origin master
cd M:/KnowledgeBase/EurSuRA-kb && git push origin master
```

---

## Notes for the implementer

- **LLM is fully stubbed in tests.** `_patch_llm` patches `call_claude` **and** `load_agent_prompt` in **both** `bootstrap` and `ingest` namespaces — necessary because ingest helpers (`enrich_glossary`, `merge_into_domain`) call `ingest.call_claude`, not bootstrap's. `load_agent_prompt` is patched to return the agent *name*, so `_fake_claude` dispatches deterministically by name (no dependence on prompt wording). No API key is needed for the test suite.
- **`_regenerate`/`_rebuild` are monkeypatched out** in the Task 7 integration test to avoid subprocess/LLM work; they're exercised for real only in Task 10.
- **cp1252:** keep all `print()`/`log()` output ASCII (`->`, not arrows).
- **Order:** Task 8 (instance `domains:`) must be in place before a real run (Task 10); the engine tests (Tasks 1-7) don't need it (they pass a `domains:` map inline).
