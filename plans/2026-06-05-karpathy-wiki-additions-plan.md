# Karpathy LLM-Wiki Additions — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a generated catalog (read-API foundation), a lint pass (change-safety guardrail), and a thin schema pointer, by selectively adopting three conventions from Karpathy's LLM Wiki.

**Architecture:** Mechanism lands in the shared `kb-framework` engine (catalog generator + lint engine + schema overview); policy, artefacts, and the `CLAUDE.md` pointer stay in the `EurSuRA-kb` instance. Both new engine pieces reuse `kb-framework/pipeline/query.py:load_articles()` and are deterministic except the opt-in `--deep` lint, which calls Claude.

**Tech Stack:** Python 3.8+, PyYAML, `anthropic` SDK (only for `--deep`), pytest 9.x, MkDocs + Material.

**Spec:** `EurSuRA-kb/specs/2026-06-05-karpathy-wiki-additions-design.md`
**Issues:** `kb-framework#1` (engine), `EurSuRA-kb#1` (wiring).

**Repo paths in this plan are absolute:**
- Engine repo root: `M:/KnowledgeBase/kb-framework`
- Instance repo root: `M:/KnowledgeBase/EurSuRA-kb`

**Conventions for every task:**
- Commit in the repo the changed files belong to. Engine commits in `kb-framework`, instance commits in `EurSuRA-kb`.
- Tests live in `kb-framework/tests/` and run with `python -m pytest` from `M:/KnowledgeBase/kb-framework`.
- Windows console is cp1252 — **no non-ASCII** (`→`, `✓`, `—`) in any `print()` or test output, or it raises `UnicodeEncodeError`. Use ASCII (`->`, `OK`, `-`).
- End every commit message with the project's `Co-Authored-By` trailer.

---

## File Structure

**Created:**
- `M:/KnowledgeBase/kb-framework/pipeline/catalog.py` — catalog generator (kept out of `query.py` to stay focused; imported by `query.py` and `ingest.py`).
- `M:/KnowledgeBase/kb-framework/pipeline/lint.py` — lint engine (checker, not generator).
- `M:/KnowledgeBase/kb-framework/agents/linter.md` — `--deep` contradiction-detection prompt.
- `M:/KnowledgeBase/kb-framework/schemas/README.md` — schema overview tying rules + schemas + agents together.
- `M:/KnowledgeBase/kb-framework/tests/conftest.py` — shared `tiny_kb` fixture.
- `M:/KnowledgeBase/kb-framework/tests/test_catalog.py`
- `M:/KnowledgeBase/kb-framework/tests/test_lint.py`
- `M:/KnowledgeBase/EurSuRA-kb/CLAUDE.md` — thin instance schema pointer (currently 0 bytes).

**Modified:**
- `M:/KnowledgeBase/kb-framework/pipeline/query.py` — add `--catalog` flag.
- `M:/KnowledgeBase/kb-framework/pipeline/ingest.py` — call `build_catalog` + warn-only lint after a successful ingest.
- `M:/KnowledgeBase/kb-framework/README.md` — refresh stale pipeline docs.
- `M:/KnowledgeBase/EurSuRA-kb/config/kb.yaml` — add `lint:` block.
- `M:/KnowledgeBase/EurSuRA-kb/mkdocs.yml` — add `Catalog: catalog.md` to nav.
- `M:/KnowledgeBase/EurSuRA-kb/.github/workflows/deploy.yml` — run deterministic lint as a hard CI gate.

---

## Phase 0 — Test harness

### Task 0: Shared pytest fixture

**Files:**
- Create: `M:/KnowledgeBase/kb-framework/tests/conftest.py`

- [ ] **Step 1: Write the fixture**

```python
# M:/KnowledgeBase/kb-framework/tests/conftest.py
import sys
from pathlib import Path

import pytest

# Make pipeline/ importable as top-level modules (query, catalog, lint).
PIPELINE = Path(__file__).resolve().parents[1] / "pipeline"
sys.path.insert(0, str(PIPELINE))


def _write(path: Path, text: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(text, encoding="utf-8")


@pytest.fixture
def tiny_kb(tmp_path: Path) -> Path:
    """A minimal KB: two domain pages, a glossary, an insight with sources."""
    docs = tmp_path / "docs"
    _write(docs / "standards" / "esrs" / "index.md",
           "---\ntitle: ESRS\nsummary: EU reporting standards.\n"
           "content_type: standard\ndomain: [ESRS]\nstatus: published\n"
           "date_updated: 2026-06-01\n---\n\n# ESRS\n\nSee [[Double Materiality]].\n")
    _write(docs / "frameworks" / "tcfd" / "index.md",
           "---\ntitle: TCFD\nsummary: Climate disclosure framework.\n"
           "content_type: framework\ndomain: [TCFD]\nstatus: published\n"
           "date_updated: 2026-06-01\n---\n\n# TCFD\n\nClimate governance and risk.\n")
    _write(docs / "glossary.md",
           "---\ntitle: Glossary\n---\n\n# Glossary\n\n"
           "## Double Materiality\n\nImpact and financial materiality.\n")
    _write(docs / "insights" / "climate.md",
           "---\ntitle: Climate Disclosure\ncontent_type: synthesis\ngenerated: true\n"
           "sources: [esrs, tcfd]\ndate_updated: 2026-06-02\n---\n\n# Climate Disclosure\n\nBody.\n")
    _write(tmp_path / "mkdocs.yml",
           "site_name: Tiny\nnav:\n"
           "  - ESRS: standards/esrs/index.md\n"
           "  - TCFD: frameworks/tcfd/index.md\n"
           "  - Glossary: glossary.md\n"
           "  - Climate: insights/climate.md\n")
    (tmp_path / "config").mkdir()
    (tmp_path / "logs").mkdir()
    return tmp_path
```

- [ ] **Step 2: Verify pytest collects it**

Run: `cd M:/KnowledgeBase/kb-framework && python -m pytest -q`
Expected: `no tests ran` (0 tests, no collection errors).

- [ ] **Step 3: Commit**

```bash
cd M:/KnowledgeBase/kb-framework
git add tests/conftest.py
git commit -m "test: add tiny_kb pytest fixture for pipeline tests"
```

---

## Phase 1 — Catalog generator (engine)

### Task 1: `build_catalog` writes catalog.json

**Files:**
- Create: `M:/KnowledgeBase/kb-framework/pipeline/catalog.py`
- Test: `M:/KnowledgeBase/kb-framework/tests/test_catalog.py`

- [ ] **Step 1: Write the failing test**

```python
# M:/KnowledgeBase/kb-framework/tests/test_catalog.py
import json
from pathlib import Path

from catalog import build_catalog


def test_catalog_json_has_one_entry_per_page(tiny_kb: Path):
    build_catalog(tiny_kb)
    data = json.loads((tiny_kb / "docs" / "catalog.json").read_text(encoding="utf-8"))
    urls = {e["url"] for e in data}
    # catalog.md/json themselves are excluded; 4 source pages remain.
    assert urls == {"standards/esrs/", "frameworks/tcfd/", "glossary/", "insights/climate/"}


def test_catalog_entry_fields_and_wikilinks(tiny_kb: Path):
    build_catalog(tiny_kb)
    data = json.loads((tiny_kb / "docs" / "catalog.json").read_text(encoding="utf-8"))
    esrs = next(e for e in data if e["url"] == "standards/esrs/")
    assert esrs["title"] == "ESRS"
    assert esrs["summary"] == "EU reporting standards."
    assert esrs["content_type"] == "standard"
    assert esrs["domain"] == ["ESRS"]
    assert esrs["status"] == "published"
    assert esrs["generated"] is False
    assert esrs["wikilinks"] == ["Double Materiality"]
    climate = next(e for e in data if e["url"] == "insights/climate/")
    assert climate["generated"] is True
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd M:/KnowledgeBase/kb-framework && python -m pytest tests/test_catalog.py -q`
Expected: FAIL with `ModuleNotFoundError: No module named 'catalog'`.

- [ ] **Step 3: Write minimal implementation**

```python
# M:/KnowledgeBase/kb-framework/pipeline/catalog.py
"""Generate the KB catalog (read-API foundation).

Deterministic, no LLM. Emits two derived artefacts from page frontmatter:
  docs/catalog.json - machine array, one object per page (served at /catalog.json).
  docs/catalog.md   - human page, grouped by content_type, with a generated banner.

Modelled on query.build_cross_ref; reuses query.load_articles.
"""

import json
import re
import datetime
from pathlib import Path

from query import load_articles

WIKILINK_RE = re.compile(r"\[\[([^\]|]+?)(?:\|[^\]]+)?\]\]")

# Pages this generator writes itself; never include them as catalog entries.
SELF_FILES = {"catalog.md", "catalog.json"}


def _site_url(rel: str) -> str:
    if rel == "index.md":
        return ""
    if rel.endswith("/index.md"):
        return rel[: -len("index.md")]
    return rel[:-3] + "/"


def _outbound_links(text: str) -> list[str]:
    return sorted({m.group(1).strip() for m in WIKILINK_RE.finditer(text)})


def collect_entries(kb_root: Path) -> list[dict]:
    docs_path = kb_root / "docs"
    entries = []
    for a in load_articles(docs_path):
        rel = a["rel_path"].as_posix()
        if rel in SELF_FILES:
            continue
        fm = a["frontmatter"] or {}
        domain = fm.get("domain", [])
        if isinstance(domain, str):
            domain = [domain]
        entries.append({
            "title": fm.get("title", rel),
            "summary": fm.get("summary", ""),
            "content_type": fm.get("content_type", ""),
            "domain": list(domain),
            "status": fm.get("status", ""),
            "generated": bool(fm.get("generated", False)),
            "url": _site_url(rel),
            "path": rel,
            "wikilinks": _outbound_links(a["text"]),
        })
    entries.sort(key=lambda e: (e["content_type"], e["path"]))
    return entries


def build_catalog(kb_root: Path) -> list[dict]:
    docs_path = kb_root / "docs"
    entries = collect_entries(kb_root)
    (docs_path / "catalog.json").write_text(
        json.dumps([{k: v for k, v in e.items() if k != "path"} for e in entries],
                   indent=2, ensure_ascii=False),
        encoding="utf-8",
    )
    return entries
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd M:/KnowledgeBase/kb-framework && python -m pytest tests/test_catalog.py -q`
Expected: PASS (2 passed).

- [ ] **Step 5: Commit**

```bash
cd M:/KnowledgeBase/kb-framework
git add pipeline/catalog.py tests/test_catalog.py
git commit -m "feat(catalog): build_catalog emits catalog.json from page frontmatter"
```

### Task 2: `build_catalog` also writes catalog.md

**Files:**
- Modify: `M:/KnowledgeBase/kb-framework/pipeline/catalog.py`
- Test: `M:/KnowledgeBase/kb-framework/tests/test_catalog.py`

- [ ] **Step 1: Add the failing test**

```python
def test_catalog_md_groups_by_type_and_has_banner(tiny_kb: Path):
    build_catalog(tiny_kb)
    md = (tiny_kb / "docs" / "catalog.md").read_text(encoding="utf-8")
    assert "generated: true" in md           # frontmatter triggers the banner
    assert "## standard" in md and "## framework" in md
    assert "[ESRS](standards/esrs/index.md)" in md   # md uses repo-relative path
    assert "*(generated)*" in md             # the insight page is flagged
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd M:/KnowledgeBase/kb-framework && python -m pytest tests/test_catalog.py::test_catalog_md_groups_by_type_and_has_banner -q`
Expected: FAIL with `FileNotFoundError` for `catalog.md`.

- [ ] **Step 3: Extend the implementation**

Add to `catalog.py` and call `_write_markdown(docs_path, entries)` from `build_catalog` before `return entries`:

```python
def _write_markdown(docs_path: Path, entries: list[dict]) -> None:
    by_type: dict[str, list[dict]] = {}
    for e in entries:
        by_type.setdefault(e["content_type"] or "other", []).append(e)

    lines = []
    for ctype in sorted(by_type):
        lines.append(f"## {ctype}\n")
        for e in by_type[ctype]:
            dom = f" `{', '.join(e['domain'])}`" if e["domain"] else ""
            flag = " *(generated)*" if e["generated"] else ""
            summary = f" - {e['summary']}" if e["summary"] else ""
            lines.append(f"- [{e['title']}]({e['path']}){dom}{summary}{flag}")
        lines.append("")

    fm = (
        "---\ntitle: Catalog\ncontent_type: model\ngenerated: true\n"
        f"date_updated: {datetime.date.today().isoformat()}\n---\n\n"
        "# Catalog\n\n"
        "Every page in this knowledge base, grouped by type. "
        "Machine-readable version: [catalog.json](catalog.json).\n\n"
    )
    (docs_path / "catalog.md").write_text(fm + "\n".join(lines), encoding="utf-8")
```

Update `build_catalog`:

```python
def build_catalog(kb_root: Path) -> list[dict]:
    docs_path = kb_root / "docs"
    entries = collect_entries(kb_root)
    (docs_path / "catalog.json").write_text(
        json.dumps([{k: v for k, v in e.items() if k != "path"} for e in entries],
                   indent=2, ensure_ascii=False),
        encoding="utf-8",
    )
    _write_markdown(docs_path, entries)
    print(f"Catalog written: {len(entries)} pages")
    return entries
```

- [ ] **Step 4: Run the full catalog test file**

Run: `cd M:/KnowledgeBase/kb-framework && python -m pytest tests/test_catalog.py -q`
Expected: PASS (3 passed).

- [ ] **Step 5: Commit**

```bash
cd M:/KnowledgeBase/kb-framework
git add pipeline/catalog.py tests/test_catalog.py
git commit -m "feat(catalog): emit human-readable catalog.md grouped by type"
```

### Task 3: Expose `--catalog` on query.py

**Files:**
- Modify: `M:/KnowledgeBase/kb-framework/pipeline/query.py` (imports near top; `main()` argparse ~lines 244-263)

- [ ] **Step 1: Add the failing test**

```python
# append to tests/test_catalog.py
import subprocess, sys, json as _json
from pathlib import Path as _Path

def test_query_catalog_flag_runs(tiny_kb: _Path):
    pipeline = _Path(__file__).resolve().parents[1] / "pipeline"
    (tiny_kb / "config" / "kb.yaml").write_text(
        "name: tiny\nframework_path: ..\n", encoding="utf-8")
    r = subprocess.run([sys.executable, str(pipeline / "query.py"),
                        "--kb", str(tiny_kb), "--catalog"],
                       capture_output=True, text=True)
    assert r.returncode == 0, r.stderr
    assert (tiny_kb / "docs" / "catalog.json").exists()
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd M:/KnowledgeBase/kb-framework && python -m pytest tests/test_catalog.py::test_query_catalog_flag_runs -q`
Expected: FAIL (`query.py: error: unrecognized arguments: --catalog`, non-zero return).

- [ ] **Step 3: Wire the flag**

Do **not** add a top-level `import` of `catalog` in `query.py` — `catalog`
imports `query`, so a top-level import creates a circular import that fails at
load. Import lazily inside `main()` instead.

In `main()`, add the argument:

```python
    parser.add_argument("--catalog", action="store_true")
```

and the dispatch (lazy import breaks the cycle):

```python
    if args.catalog:
        from catalog import build_catalog
        build_catalog(kb_root)
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd M:/KnowledgeBase/kb-framework && python -m pytest tests/test_catalog.py -q`
Expected: PASS (4 passed).

- [ ] **Step 5: Commit**

```bash
cd M:/KnowledgeBase/kb-framework
git add pipeline/query.py tests/test_catalog.py
git commit -m "feat(catalog): add --catalog flag to query.py"
```

### Task 4: Regenerate catalog on ingest

**Files:**
- Modify: `M:/KnowledgeBase/kb-framework/pipeline/ingest.py`

- [ ] **Step 1: Locate the regeneration site**

Run: `cd M:/KnowledgeBase/kb-framework && python -c "import re,io; print([l for l in open('pipeline/ingest.py',encoding='utf-8') if 'synthesis' in l.lower() or 'cross' in l.lower()])"`
Expected: prints the line(s) where `build_synthesis` / `build_cross_ref` are called after a successful ingest. This is the insertion point.

- [ ] **Step 2: Add the call**

At the top of `ingest.py`, alongside the existing query imports, add:

```python
from catalog import build_catalog
```

Immediately after the existing `build_cross_ref(...)` / `build_synthesis(...)` calls (the regeneration block identified in Step 1), add:

```python
    build_catalog(kb_root)
```

(Use the same `kb_root` variable name already in scope at that call site; if it is named differently, match the local name.)

- [ ] **Step 3: Verify it imports and compiles**

Run: `cd M:/KnowledgeBase/kb-framework && python -m py_compile pipeline/ingest.py && echo OK`
Expected: `OK` (no output from py_compile, then `OK`).

- [ ] **Step 4: Commit**

```bash
cd M:/KnowledgeBase/kb-framework
git add pipeline/ingest.py
git commit -m "feat(catalog): regenerate catalog on every ingest"
```

---

## Phase 2 — Lint engine (engine)

The lint engine reuses `query.load_articles`. Findings are tuples `(kind, path, detail)` with `kind` in `{"ORPHAN","STALE","XREF","CONTRADICTION"}`. The deterministic checks form the CI gate; `--deep` adds the LLM contradiction check.

### Task 5: Dangling-source check

**Files:**
- Create: `M:/KnowledgeBase/kb-framework/pipeline/lint.py`
- Test: `M:/KnowledgeBase/kb-framework/tests/test_lint.py`

- [ ] **Step 1: Write the failing test**

```python
# M:/KnowledgeBase/kb-framework/tests/test_lint.py
from pathlib import Path

import lint


def test_dangling_source_flagged(tiny_kb: Path):
    # Point the insight at a domain slug that does not exist.
    p = tiny_kb / "docs" / "insights" / "climate.md"
    p.write_text(p.read_text(encoding="utf-8").replace(
        "sources: [esrs, tcfd]", "sources: [esrs, nonexistent]"), encoding="utf-8")
    findings = lint.check_dangling_sources(lint.load(tiny_kb))
    assert any(k == "STALE" and "nonexistent" in d for k, _, d in findings)


def test_no_dangling_when_all_sources_exist(tiny_kb: Path):
    findings = lint.check_dangling_sources(lint.load(tiny_kb))
    assert findings == []
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd M:/KnowledgeBase/kb-framework && python -m pytest tests/test_lint.py -q`
Expected: FAIL with `ModuleNotFoundError: No module named 'lint'`.

- [ ] **Step 3: Write minimal implementation**

```python
# M:/KnowledgeBase/kb-framework/pipeline/lint.py
"""Lint the knowledge base: a checker, not a generator.

Automated enforcement of kb-framework/rules/quality-checklist.md. Deterministic
checks (orphans, stale/dangling sources, missing cross-references) form the CI
gate; the opt-in --deep tier adds an LLM contradiction check.

Exit code: 0 if no hard failures, 1 otherwise (hard set comes from config).
"""

import re
from pathlib import Path

from query import load_articles

Finding = tuple[str, str, str]  # (kind, path, detail)


def load(kb_root: Path) -> list[dict]:
    return load_articles(kb_root / "docs")


def _domain_slug_exists(docs_path: Path, slug: str) -> bool:
    return any((docs_path / sub / slug / "index.md").exists()
               for sub in ("standards", "frameworks"))


def check_dangling_sources(articles: list[dict]) -> list[Finding]:
    # articles[0]["path"] is an absolute Path; derive docs_path from it.
    if not articles:
        return []
    docs_path = articles[0]["path"].parents[len(articles[0]["rel_path"].parts) - 1]
    findings: list[Finding] = []
    for a in articles:
        rel = a["rel_path"].as_posix()
        for slug in (a["frontmatter"] or {}).get("sources", []) or []:
            if not _domain_slug_exists(docs_path, slug):
                findings.append(("STALE", rel, f"source '{slug}' not found"))
    return findings
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd M:/KnowledgeBase/kb-framework && python -m pytest tests/test_lint.py -q`
Expected: PASS (2 passed).

- [ ] **Step 5: Commit**

```bash
cd M:/KnowledgeBase/kb-framework
git add pipeline/lint.py tests/test_lint.py
git commit -m "feat(lint): dangling-source check"
```

### Task 6: Stale-derivation check

**Files:**
- Modify: `M:/KnowledgeBase/kb-framework/pipeline/lint.py`
- Test: `M:/KnowledgeBase/kb-framework/tests/test_lint.py`

- [ ] **Step 1: Add the failing test**

```python
def test_stale_when_source_newer_than_generated(tiny_kb: Path):
    # ESRS (source) updated 2026-06-10, after the insight's 2026-06-02.
    e = tiny_kb / "docs" / "standards" / "esrs" / "index.md"
    e.write_text(e.read_text(encoding="utf-8").replace(
        "date_updated: 2026-06-01", "date_updated: 2026-06-10"), encoding="utf-8")
    findings = lint.check_stale(lint.load(tiny_kb))
    assert any(k == "STALE" and "insights/climate.md" in p for k, p, _ in findings)
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd M:/KnowledgeBase/kb-framework && python -m pytest tests/test_lint.py::test_stale_when_source_newer_than_generated -q`
Expected: FAIL with `AttributeError: module 'lint' has no attribute 'check_stale'`.

- [ ] **Step 3: Extend the implementation**

```python
def _date(fm: dict) -> str:
    return str(fm.get("date_updated", "")) if fm else ""


def check_stale(articles: list[dict]) -> list[Finding]:
    by_slug: dict[str, str] = {}
    for a in articles:
        parts = a["rel_path"].parts
        if len(parts) == 3 and parts[0] in ("standards", "frameworks") and parts[2] == "index.md":
            by_slug[parts[1]] = _date(a["frontmatter"])
    findings: list[Finding] = []
    for a in articles:
        fm = a["frontmatter"] or {}
        own = _date(fm)
        if not own:
            continue
        for slug in fm.get("sources", []) or []:
            src = by_slug.get(slug, "")
            if src and src > own:
                findings.append(("STALE", a["rel_path"].as_posix(),
                                 f"source '{slug}' ({src}) is newer than this page ({own})"))
    return findings
```

(ISO `YYYY-MM-DD` dates compare correctly as strings.)

- [ ] **Step 4: Run test to verify it passes**

Run: `cd M:/KnowledgeBase/kb-framework && python -m pytest tests/test_lint.py -q`
Expected: PASS (3 passed).

- [ ] **Step 5: Commit**

```bash
cd M:/KnowledgeBase/kb-framework
git add pipeline/lint.py tests/test_lint.py
git commit -m "feat(lint): stale-derivation check (source newer than generated page)"
```

### Task 7: Orphan check

**Files:**
- Modify: `M:/KnowledgeBase/kb-framework/pipeline/lint.py`
- Test: `M:/KnowledgeBase/kb-framework/tests/test_lint.py`

A page is an orphan if it is in neither (a) the mkdocs `nav` nor (b) the set of pages reachable as the *target* of any `[[wikilink]]`. A wikilink resolves to a target page by matching its text against a page **title** or, for `glossary.md`, against any glossary **heading/term** (mirroring how `hooks.py` resolves links — `[[Double Materiality]]` points at `glossary.md`). Pages with `orphan_ok: true` frontmatter are skipped. `nav` is read from `mkdocs.yml` if present; the unit tests pass `nav_paths=set()` explicitly to drive the wikilink-resolution path.

- [ ] **Step 1: Add the failing test**

```python
def test_orphan_detected_and_orphan_ok_skips(tiny_kb: Path):
    # Add a page reachable from nothing.
    orphan = tiny_kb / "docs" / "reports" / "lonely.md"
    orphan.parent.mkdir(parents=True)
    orphan.write_text("---\ntitle: Lonely\ncontent_type: report\n---\n\n# Lonely\n",
                      encoding="utf-8")
    findings = lint.check_orphans(lint.load(tiny_kb), nav_paths=set())
    assert any(k == "ORPHAN" and "reports/lonely.md" in p for k, p, _ in findings)

    # Marking it orphan_ok clears the finding.
    orphan.write_text("---\ntitle: Lonely\ncontent_type: report\norphan_ok: true\n"
                      "---\n\n# Lonely\n", encoding="utf-8")
    findings = lint.check_orphans(lint.load(tiny_kb), nav_paths=set())
    assert not any("reports/lonely.md" in p for _, p, _ in findings)


def test_wikilinked_page_is_not_orphan(tiny_kb: Path):
    # glossary.md is referenced via [[Double Materiality]] from ESRS.
    findings = lint.check_orphans(lint.load(tiny_kb), nav_paths=set())
    assert not any("glossary.md" in p for _, p, _ in findings)
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd M:/KnowledgeBase/kb-framework && python -m pytest tests/test_lint.py::test_orphan_detected_and_orphan_ok_skips -q`
Expected: FAIL with `AttributeError: module 'lint' has no attribute 'check_orphans'`.

- [ ] **Step 3: Extend the implementation**

```python
WIKILINK_RE = re.compile(r"\[\[([^\]|]+?)(?:\|[^\]]+)?\]\]")
HEADING_RE = re.compile(r"^#{2,3}\s+(.+?)\s*#*$", re.MULTILINE)


def _norm(s: str) -> str:
    return re.sub(r"\s+", " ", s).strip().lower()


def _referenced_pages(articles: list[dict]) -> set[str]:
    """rel_paths reachable as the target of some [[wikilink]] (title or glossary term)."""
    title_to_path: dict[str, str] = {}
    glossary_rel: str | None = None
    glossary_terms: set[str] = set()
    for a in articles:
        rel = a["rel_path"].as_posix()
        title = _norm(str((a["frontmatter"] or {}).get("title", "")))
        if title:
            title_to_path.setdefault(title, rel)
        if rel == "glossary.md":
            glossary_rel = rel
            for h in HEADING_RE.findall(a["text"]):
                if _norm(h) != "glossary":
                    glossary_terms.add(_norm(h))

    referenced: set[str] = set()
    for a in articles:
        for m in WIKILINK_RE.finditer(a["text"]):
            key = _norm(m.group(1))
            if key in title_to_path:
                referenced.add(title_to_path[key])
            elif glossary_rel and key in glossary_terms:
                referenced.add(glossary_rel)
    return referenced


def check_orphans(articles: list[dict], nav_paths: set[str]) -> list[Finding]:
    referenced = _referenced_pages(articles)
    findings: list[Finding] = []
    for a in articles:
        fm = a["frontmatter"] or {}
        rel = a["rel_path"].as_posix()
        if rel == "index.md" or fm.get("orphan_ok"):
            continue
        if rel in nav_paths or rel in referenced:
            continue
        findings.append(("ORPHAN", rel, "not in nav and not referenced by any wikilink"))
    return findings


def nav_paths_from_mkdocs(kb_root: Path) -> set[str]:
    import yaml
    mk = kb_root / "mkdocs.yml"
    if not mk.exists():
        return set()
    cfg = yaml.safe_load(mk.read_text(encoding="utf-8")) or {}
    found: set[str] = set()

    def walk(node):
        if isinstance(node, str):
            found.add(node)
        elif isinstance(node, list):
            for item in node:
                walk(item)
        elif isinstance(node, dict):
            for value in node.values():
                walk(value)

    walk(cfg.get("nav", []))
    return found
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd M:/KnowledgeBase/kb-framework && python -m pytest tests/test_lint.py -q`
Expected: PASS (5 passed).

- [ ] **Step 5: Commit**

```bash
cd M:/KnowledgeBase/kb-framework
git add pipeline/lint.py tests/test_lint.py
git commit -m "feat(lint): orphan check via nav + wikilink references, honouring orphan_ok"
```

### Task 8: Missing cross-reference check

**Files:**
- Modify: `M:/KnowledgeBase/kb-framework/pipeline/lint.py`
- Test: `M:/KnowledgeBase/kb-framework/tests/test_lint.py`

Flags a page whose body contains a glossary term verbatim but not wrapped in `[[...]]`. An ignore list (passed in) suppresses noisy terms.

- [ ] **Step 1: Add the failing test**

```python
def test_missing_xref_flagged_and_ignored(tiny_kb: Path):
    # TCFD body mentions "double materiality" in plain text.
    t = tiny_kb / "docs" / "frameworks" / "tcfd" / "index.md"
    t.write_text(t.read_text(encoding="utf-8").replace(
        "Climate governance and risk.",
        "Climate governance and double materiality."), encoding="utf-8")
    arts = lint.load(tiny_kb)
    findings = lint.check_missing_xrefs(arts, ignore=set())
    assert any(k == "XREF" and "tcfd" in p and "double materiality" in d.lower()
               for k, p, d in findings)
    # Ignore list suppresses it.
    findings = lint.check_missing_xrefs(arts, ignore={"double materiality"})
    assert not any(k == "XREF" for k, _, _ in findings)
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd M:/KnowledgeBase/kb-framework && python -m pytest tests/test_lint.py::test_missing_xref_flagged_and_ignored -q`
Expected: FAIL with `AttributeError: module 'lint' has no attribute 'check_missing_xrefs'`.

- [ ] **Step 3: Extend the implementation**

`HEADING_RE` is already defined in Task 7; reuse it.

```python
def _glossary_terms(articles: list[dict]) -> list[str]:
    for a in articles:
        if a["rel_path"].as_posix() == "glossary.md":
            terms = [h.strip() for h in HEADING_RE.findall(a["text"])]
            return [t for t in terms if _norm(t) != "glossary"]
    return []


def check_missing_xrefs(articles: list[dict], ignore: set[str]) -> list[Finding]:
    terms = _glossary_terms(articles)
    findings: list[Finding] = []
    for a in articles:
        rel = a["rel_path"].as_posix()
        if rel == "glossary.md":
            continue
        # Strip existing wikilinks so a linked mention does not count.
        plain = WIKILINK_RE.sub(" ", a["text"]).lower()
        for term in terms:
            n = _norm(term)
            if n in ignore:
                continue
            if re.search(rf"\b{re.escape(n)}\b", plain):
                findings.append(("XREF", rel, f"mentions '{term}' without a [[wikilink]]"))
    return findings
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd M:/KnowledgeBase/kb-framework && python -m pytest tests/test_lint.py -q`
Expected: PASS (7 passed).

- [ ] **Step 5: Commit**

```bash
cd M:/KnowledgeBase/kb-framework
git add pipeline/lint.py tests/test_lint.py
git commit -m "feat(lint): missing cross-reference check with ignore list"
```

### Task 9: Config, runner, exit code, log

**Files:**
- Modify: `M:/KnowledgeBase/kb-framework/pipeline/lint.py`
- Test: `M:/KnowledgeBase/kb-framework/tests/test_lint.py`

`run_deterministic(kb_root, config)` aggregates the four checks, writes `logs/lint.log`, prints an ASCII summary, and returns `(findings, hard_failed)`. `config["lint"]` may set `hard_fail` (list of kinds that fail the build) and `ignore_terms`. Defaults: `hard_fail = ["ORPHAN", "STALE"]`, `ignore_terms = []`.

- [ ] **Step 1: Add the failing test**

```python
def test_run_deterministic_writes_log_and_sets_hard_fail(tiny_kb: Path):
    orphan = tiny_kb / "docs" / "reports" / "lonely.md"
    orphan.parent.mkdir(parents=True)
    orphan.write_text("---\ntitle: Lonely\ncontent_type: report\n---\n\n# Lonely\n",
                      encoding="utf-8")
    findings, hard = lint.run_deterministic(tiny_kb, {"lint": {"hard_fail": ["ORPHAN"]}})
    assert hard is True
    assert (tiny_kb / "logs" / "lint.log").exists()
    log = (tiny_kb / "logs" / "lint.log").read_text(encoding="utf-8")
    assert "ORPHAN" in log and "reports/lonely.md" in log


def test_run_deterministic_clean_kb_passes(tiny_kb: Path):
    findings, hard = lint.run_deterministic(tiny_kb, {})
    assert hard is False
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd M:/KnowledgeBase/kb-framework && python -m pytest tests/test_lint.py::test_run_deterministic_clean_kb_passes -q`
Expected: FAIL with `AttributeError: module 'lint' has no attribute 'run_deterministic'`.

- [ ] **Step 3: Extend the implementation**

```python
DEFAULT_HARD_FAIL = ["ORPHAN", "STALE"]


def run_deterministic(kb_root: Path, config: dict) -> tuple[list[Finding], bool]:
    lint_cfg = (config or {}).get("lint", {}) or {}
    hard_kinds = set(lint_cfg.get("hard_fail", DEFAULT_HARD_FAIL))
    ignore = {_norm(t) for t in lint_cfg.get("ignore_terms", [])}

    articles = load(kb_root)
    nav = nav_paths_from_mkdocs(kb_root)
    findings: list[Finding] = []
    findings += check_orphans(articles, nav)
    findings += check_dangling_sources(articles)
    findings += check_stale(articles)
    findings += check_missing_xrefs(articles, ignore)

    lines = [f"{k}\t{p}\t{d}" for k, p, d in findings]
    log_dir = kb_root / "logs"
    log_dir.mkdir(exist_ok=True)
    (log_dir / "lint.log").write_text("\n".join(lines) + ("\n" if lines else ""),
                                      encoding="utf-8")

    hard_failed = any(k in hard_kinds for k, _, _ in findings)
    counts: dict[str, int] = {}
    for k, _, _ in findings:
        counts[k] = counts.get(k, 0) + 1
    summary = ", ".join(f"{k}={counts[k]}" for k in sorted(counts)) or "no findings"
    print(f"lint: {summary} | hard_fail={'YES' if hard_failed else 'no'}")
    return findings, hard_failed


def main() -> int:
    import argparse
    import yaml
    parser = argparse.ArgumentParser()
    parser.add_argument("--kb", required=True)
    parser.add_argument("--deep", action="store_true")
    args = parser.parse_args()

    kb_root = Path(args.kb).resolve()
    cfg_file = kb_root / "config" / "kb.yaml"
    config = yaml.safe_load(cfg_file.read_text(encoding="utf-8")) if cfg_file.exists() else {}

    findings, hard_failed = run_deterministic(kb_root, config or {})
    if args.deep:
        deep = run_deep(kb_root, config or {})  # defined in Task 10
        for k, p, d in deep:
            print(f"  {k}\t{p}\t{d}")
    return 1 if hard_failed else 0


if __name__ == "__main__":
    raise SystemExit(main())
```

- [ ] **Step 4: Run the full lint test file**

Run: `cd M:/KnowledgeBase/kb-framework && python -m pytest tests/test_lint.py -q`
Expected: PASS (8 passed).

- [ ] **Step 5: Commit**

```bash
cd M:/KnowledgeBase/kb-framework
git add pipeline/lint.py tests/test_lint.py
git commit -m "feat(lint): aggregate runner with config, log, summary, exit code"
```

### Task 10: `--deep` contradiction check (LLM, monkeypatched in tests)

**Files:**
- Create: `M:/KnowledgeBase/kb-framework/agents/linter.md`
- Modify: `M:/KnowledgeBase/kb-framework/pipeline/lint.py`
- Test: `M:/KnowledgeBase/kb-framework/tests/test_lint.py`

- [ ] **Step 1: Write the agent prompt**

```markdown
<!-- M:/KnowledgeBase/kb-framework/agents/linter.md -->
# Linter agent

System prompt used by `pipeline/lint.py --deep` to flag factual contradictions
between canonical knowledge-base pages.

```
You are a meticulous fact-checker for a sustainability-reporting knowledge base.
You are given several canonical pages and a glossary. Identify direct factual
contradictions BETWEEN pages (not within one). For each, output one line:

CONTRADICTION <pageA> vs <pageB>: <one-sentence description>

Only report clear contradictions of fact (dates, numbers, definitions,
obligations). If there are none, output exactly: NONE
```
```

- [ ] **Step 2: Add the failing test (monkeypatched LLM)**

```python
def test_deep_parses_contradiction_lines(tiny_kb: Path, monkeypatch):
    (tiny_kb / "config" / "kb.yaml").write_text(
        "name: tiny\nframework_path: ..\n", encoding="utf-8")
    import query
    monkeypatch.setattr(query, "call_claude",
                        lambda *a, **k: "CONTRADICTION esrs vs tcfd: scope differs")
    monkeypatch.setattr(lint, "call_claude",
                        lambda *a, **k: "CONTRADICTION esrs vs tcfd: scope differs",
                        raising=False)
    findings = lint.run_deep(tiny_kb, {})
    assert findings and findings[0][0] == "CONTRADICTION"


def test_deep_none_yields_no_findings(tiny_kb: Path, monkeypatch):
    monkeypatch.setattr(lint, "call_claude", lambda *a, **k: "NONE", raising=False)
    assert lint.run_deep(tiny_kb, {}) == []
```

- [ ] **Step 3: Run test to verify it fails**

Run: `cd M:/KnowledgeBase/kb-framework && python -m pytest tests/test_lint.py::test_deep_none_yields_no_findings -q`
Expected: FAIL with `AttributeError: module 'lint' has no attribute 'run_deep'`.

- [ ] **Step 4: Extend the implementation**

Add to the imports in `lint.py`:

```python
from query import call_claude, load_agent_prompt, _strip_frontmatter
```

Add:

```python
CONTRA_RE = re.compile(r"^CONTRADICTION\s+(.+?)\s+vs\s+(.+?):\s*(.+)$", re.MULTILINE)


def run_deep(kb_root: Path, config: dict) -> list[Finding]:
    articles = load(kb_root)
    fw_raw = (config or {}).get("framework_path", "../kb-framework")
    fw_path = (kb_root / fw_raw).resolve()
    prompt = load_agent_prompt(fw_path, "linter")

    # Canonical domain pages only (skip generated and glossary).
    canon = [a for a in articles
             if a["rel_path"].parts[0] in ("standards", "frameworks")
             and a["rel_path"].name == "index.md"]
    blocks = "\n\n---\n\n".join(
        f"# PAGE: {a['rel_path'].as_posix()}\n{_strip_frontmatter(a['text'])[:4000]}"
        for a in canon)
    reply = call_claude(prompt, blocks)

    findings: list[Finding] = []
    for m in CONTRA_RE.finditer(reply):
        findings.append(("CONTRADICTION", f"{m.group(1)} vs {m.group(2)}", m.group(3).strip()))
    return findings
```

(The `config` here is the full kb.yaml dict, so `framework_path` resolves the agent location exactly as `query.main` does.)

- [ ] **Step 5: Run the full lint test file**

Run: `cd M:/KnowledgeBase/kb-framework && python -m pytest tests/test_lint.py -q`
Expected: PASS (10 passed).

- [ ] **Step 6: Commit**

```bash
cd M:/KnowledgeBase/kb-framework
git add agents/linter.md pipeline/lint.py tests/test_lint.py
git commit -m "feat(lint): opt-in --deep contradiction check via linter agent"
```

### Task 11: Warn-only lint on ingest

**Files:**
- Modify: `M:/KnowledgeBase/kb-framework/pipeline/ingest.py`

- [ ] **Step 1: Add the call (warn-only, never raises)**

After the `build_catalog(kb_root)` line added in Task 4, add:

```python
    try:
        from lint import run_deterministic
        import yaml as _yaml
        _cfg_file = kb_root / "config" / "kb.yaml"
        _cfg = _yaml.safe_load(_cfg_file.read_text(encoding="utf-8")) if _cfg_file.exists() else {}
        run_deterministic(kb_root, _cfg or {})  # prints summary; never blocks local commit
    except Exception as exc:
        print(f"lint: skipped ({exc})")
```

- [ ] **Step 2: Verify it compiles**

Run: `cd M:/KnowledgeBase/kb-framework && python -m py_compile pipeline/ingest.py && echo OK`
Expected: `OK`.

- [ ] **Step 3: Commit**

```bash
cd M:/KnowledgeBase/kb-framework
git add pipeline/ingest.py
git commit -m "feat(lint): run warn-only deterministic lint after ingest"
```

---

## Phase 3 — Schema overview + framework docs (engine)

### Task 12: Schema overview

**Files:**
- Create: `M:/KnowledgeBase/kb-framework/schemas/README.md`

- [ ] **Step 1: Write the overview**

```markdown
# KB Schema Overview

The "schema layer" for every knowledge base built on this framework. It is the
one place that names the structure all KBs share; instances point here rather
than copying it.

## The three layers
1. **Domain layer** - canonical `standards/<slug>/index.md` and
   `frameworks/<slug>/index.md`. New facts are *merged* into these pages, not
   added as parallel summaries.
2. **Shared graph** - the single `glossary.md`. Terms are upserted; domain pages
   reference them via `[[wikilinks]]` and never redefine them.
3. **Synthesis layer** - regenerated artefacts (`insights/*`,
   `cross-reference-matrix.md`, `models/*`, `catalog.*`). All carry
   `generated: true` and must not be hand-edited.

## Frontmatter
Required: `title`. Common: `summary`, `content_type`
(`standard|directive|framework|term|model|report|synthesis`), `domain` (list),
`status` (`draft|review|published`). Generated pages add `generated: true` and
`date_updated`. See per-type schemas: `standard.yaml`, `report.yaml`, `term.yaml`.

## Operations
- **ingest** (`pipeline/ingest.py`) - PDF -> enriched page -> merge -> regenerate
  synthesis, cross-ref, catalog -> warn-only lint -> local commit.
- **query** (`pipeline/query.py`) - `--synthesis`, `--cross-ref`, `--model`,
  `--catalog`.
- **lint** (`pipeline/lint.py`) - deterministic checks (CI gate) + `--deep`
  contradiction check. Enforces `rules/quality-checklist.md`.

## Rules
Editorial rules in `rules/` are authoritative: `writing-style.md`, `tagging.md`,
`term-definition.md`, `cross-referencing.md`, `quality-checklist.md`.
```

- [ ] **Step 2: Commit**

```bash
cd M:/KnowledgeBase/kb-framework
git add schemas/README.md
git commit -m "docs(schema): add KB schema overview tying rules, schemas, agents"
```

### Task 13: Refresh framework README

**Files:**
- Modify: `M:/KnowledgeBase/kb-framework/README.md`

- [ ] **Step 1: Update the agents table** — add a row:

```markdown
| [`linter.md`](agents/linter.md) | Flags factual contradictions between canonical pages (`lint.py --deep`) |
```

- [ ] **Step 2: Update the Pipeline Scripts table** — replace the `query.py` row and add `lint.py`:

```markdown
| [`query.py`](pipeline/query.py) | Regenerate derived artefacts: `--synthesis`, `--cross-ref`, `--model`, `--catalog` |
| [`lint.py`](pipeline/lint.py) | Health-check the KB: orphans, stale/dangling sources, missing cross-refs; `--deep` adds contradiction detection |
```

- [ ] **Step 3: Update the "On success the pipeline" numbered list** — replace steps 5-7 so they read:

```markdown
5. Merges new facts into the canonical domain `index.md` (not a parallel page)
6. Upserts extracted terms into `glossary.md`
7. Regenerates synthesis pages, the cross-reference matrix, and the catalog
8. Runs a warn-only deterministic lint, then commits locally (no push)
```

- [ ] **Step 4: Add a one-line pointer under Schemas** to `schemas/README.md`:

```markdown
See [`schemas/README.md`](schemas/README.md) for the schema overview (the three layers, frontmatter, operations).
```

- [ ] **Step 5: Verify links resolve**

Run: `cd M:/KnowledgeBase/kb-framework && python -c "import pathlib; [print('MISSING', f) for f in ['agents/linter.md','pipeline/lint.py','schemas/README.md'] if not pathlib.Path(f).exists()]; print('checked')"`
Expected: `checked` with no `MISSING` lines.

- [ ] **Step 6: Commit**

```bash
cd M:/KnowledgeBase/kb-framework
git add README.md
git commit -m "docs: refresh README for three-layer merge, catalog, and lint"
```

---

## Phase 4 — Instance wiring (EurSuRA-kb)

### Task 14: Lint policy in kb.yaml

**Files:**
- Modify: `M:/KnowledgeBase/EurSuRA-kb/config/kb.yaml`

- [ ] **Step 1: Append the lint block**

```yaml
lint:
  hard_fail: [ORPHAN, STALE]      # kinds that fail CI; XREF and CONTRADICTION are advisory
  ignore_terms:                   # glossary terms too common to require wikilinking
    - sustainability
    - climate change
```

- [ ] **Step 2: Verify it parses**

Run: `cd M:/KnowledgeBase/EurSuRA-kb && python -c "import yaml; print(yaml.safe_load(open('config/kb.yaml',encoding='utf-8'))['lint']['hard_fail'])"`
Expected: `['ORPHAN', 'STALE']`.

- [ ] **Step 3: Run lint against the real KB and triage**

Run: `cd M:/KnowledgeBase/EurSuRA-kb && python ../kb-framework/pipeline/lint.py --kb .`
Expected: prints a summary line. **Triage any ORPHAN/STALE hard failures now:** add `orphan_ok: true` to pages intentionally reachable only via search (e.g. some `reports/*`), or fix the dangling source. Re-run until `hard_fail=no`. Record nothing in code beyond `orphan_ok` flags and ignore_terms.

- [ ] **Step 4: Commit**

```bash
cd M:/KnowledgeBase/EurSuRA-kb
git add config/kb.yaml docs/
git commit -m "chore(lint): add lint policy and triage orphan_ok flags"
```

### Task 15: Add catalog to nav

**Files:**
- Modify: `M:/KnowledgeBase/EurSuRA-kb/mkdocs.yml`

- [ ] **Step 1: Add a nav entry** after the `Glossary` line:

```yaml
  - Catalog: catalog.md
```

- [ ] **Step 2: Generate the catalog so the file exists**

Run: `cd M:/KnowledgeBase/EurSuRA-kb && python ../kb-framework/pipeline/query.py --kb . --catalog`
Expected: `Catalog written: N pages`; `docs/catalog.md` and `docs/catalog.json` now exist.

- [ ] **Step 3: Strict build must pass**

Run: `cd M:/KnowledgeBase/EurSuRA-kb && python -m mkdocs build --config-file mkdocs.yml --strict`
Expected: build succeeds with no warnings (catalog.md is now in nav; catalog.json is copied as a static file). If a "not in nav" warning appears for catalog.md, confirm Step 1 indentation matches the other nav entries.

- [ ] **Step 4: Commit**

```bash
cd M:/KnowledgeBase/EurSuRA-kb
git add mkdocs.yml docs/catalog.md docs/catalog.json
git commit -m "feat(catalog): add catalog page to nav and generate it"
```

### Task 16: CI hard gate

**Files:**
- Modify: `M:/KnowledgeBase/EurSuRA-kb/.github/workflows/deploy.yml`

- [ ] **Step 1: Read the current workflow**

Run: `cd M:/KnowledgeBase/EurSuRA-kb && python -c "print(open('.github/workflows/deploy.yml',encoding='utf-8').read())"`
Expected: shows the job that runs `mkdocs build --strict`. Identify the step immediately before it (and confirm `../kb-framework` is available — if CI only checks out EurSuRA-kb, add a checkout of `kb-framework` into a sibling path first).

- [ ] **Step 2: Add a lint step before the strict build**

Insert this step just before the `mkdocs build --strict` step (same `steps:` list, matching indentation):

```yaml
      - name: Lint knowledge base (deterministic gate)
        run: python ../kb-framework/pipeline/lint.py --kb .
```

If `kb-framework` is not already checked out in CI, add before it:

```yaml
      - name: Check out kb-framework
        uses: actions/checkout@v4
        with:
          repository: hvroosmalen-eaxpertise/kb-framework
          path: ../kb-framework
```

- [ ] **Step 3: Validate the workflow YAML**

Run: `cd M:/KnowledgeBase/EurSuRA-kb && python -c "import yaml; yaml.safe_load(open('.github/workflows/deploy.yml',encoding='utf-8')); print('valid')"`
Expected: `valid`.

- [ ] **Step 4: Commit**

```bash
cd M:/KnowledgeBase/EurSuRA-kb
git add .github/workflows/deploy.yml
git commit -m "ci: run deterministic lint as a hard gate before strict build"
```

### Task 17: Thin CLAUDE.md schema pointer

**Files:**
- Modify: `M:/KnowledgeBase/EurSuRA-kb/CLAUDE.md` (currently 0 bytes)

- [ ] **Step 1: Write the pointer**

```markdown
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
```

- [ ] **Step 2: Confirm it is not published** (it sits at repo root, outside `docs/`)

Run: `cd M:/KnowledgeBase/EurSuRA-kb && python -c "import os; print('in docs' if os.path.exists('docs/CLAUDE.md') else 'root only')"`
Expected: `root only`.

- [ ] **Step 3: Commit**

```bash
cd M:/KnowledgeBase/EurSuRA-kb
git add CLAUDE.md
git commit -m "docs: add thin CLAUDE.md pointing at the framework schema"
```

---

## Phase 5 — Final verification

### Task 18: Full regression

- [ ] **Step 1: Engine test suite green**

Run: `cd M:/KnowledgeBase/kb-framework && python -m pytest -q`
Expected: all tests pass (14 total: 4 in test_catalog.py, 10 in test_lint.py).

- [ ] **Step 2: Pipeline scripts compile**

Run: `cd M:/KnowledgeBase/kb-framework && python -m py_compile pipeline/catalog.py pipeline/lint.py pipeline/query.py pipeline/ingest.py && echo OK`
Expected: `OK`.

- [ ] **Step 3: Real KB lints clean and builds strict**

Run: `cd M:/KnowledgeBase/EurSuRA-kb && python ../kb-framework/pipeline/lint.py --kb . && python -m mkdocs build --config-file mkdocs.yml --strict`
Expected: lint prints `hard_fail=no`; mkdocs build succeeds with no warnings.

- [ ] **Step 4: Catalog endpoint is in the built site**

Run: `cd M:/KnowledgeBase/EurSuRA-kb && python -c "import os; print('OK' if os.path.exists('site/catalog.json') else 'MISSING')"`
Expected: `OK` (the read-API endpoint is served).

- [ ] **Step 5: Push both repos** (only after the user confirms)

```bash
cd M:/KnowledgeBase/kb-framework && git push origin master
cd M:/KnowledgeBase/EurSuRA-kb && git push origin master
```

- [ ] **Step 6: Close the issues**

```bash
gh issue close 1 --repo hvroosmalen-eaxpertise/kb-framework
gh issue close 1 --repo hvroosmalen-eaxpertise/EurSuRA-kb
```

---

## Notes for the implementer

- **Import style:** `conftest.py` puts `pipeline/` on `sys.path`, so tests and modules import `query`, `catalog`, `lint` as top-level modules — matching how the existing scripts import each other.
- **No live LLM in tests:** only `--deep` calls Claude; tests monkeypatch `call_claude`. Never set a real `ANTHROPIC_API_KEY` in CI for these tests.
- **cp1252:** keep all `print()` / log output ASCII.
- **Order matters:** Phase 4 depends on Phases 1-3 being committed in `kb-framework`. If running CI (Task 16) before pushing `kb-framework`, the workflow's `kb-framework` checkout will pull `master` — push the engine repo first.
