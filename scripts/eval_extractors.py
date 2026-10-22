"""Compare PDF-to-Markdown extractors on a fixed four-PDF corpus (issue #16).

Runs pypdf (baseline), pymupdf4llm, docling, and marker over the four readable
inbox PDFs chosen in `specs/2026-10-22-pdf-extractor-eval-design.md`. Writes
each extractor's Markdown output to `logs/extractor-eval/<extractor>/<stem>.md`
and prints a wall-clock + char-count summary table.

Each extractor is imported lazily; a missing one is skipped with a note, not a
crash. The downstream `extraction_looks_readable()` guard is run on every
output so the harness also surfaces regressions a quality rubric would miss.
"""
from __future__ import annotations

import importlib
import sys
import time
from pathlib import Path

KB_ROOT = Path(__file__).resolve().parent.parent
FRAMEWORK = KB_ROOT.parent / "kb-framework"
sys.path.insert(0, str(FRAMEWORK / "pipeline"))
from ingest import extraction_looks_readable  # noqa: E402

CORPUS = [
    "Corp.Sust.Strategies-specialissueSD_Original.pdf",
    "Modeling_Corporate_Sustainability_Strate.pdf",
    "The_Sustainability_Balanced_Scorecard_li.pdf",
    "Crafting_Corporate_Sustainability_Strate.pdf",
]
INBOX = KB_ROOT / "pipeline" / "inbox"
OUT_DIR = KB_ROOT / "logs" / "extractor-eval"


def extract_pypdf(pdf: Path) -> str:
    import pypdf
    reader = pypdf.PdfReader(str(pdf))
    return "\n\n".join((p.extract_text() or "") for p in reader.pages)


def extract_pymupdf4llm(pdf: Path) -> str:
    pymupdf4llm = importlib.import_module("pymupdf4llm")
    return pymupdf4llm.to_markdown(str(pdf))


def extract_docling(pdf: Path) -> str:
    DocumentConverter = importlib.import_module(
        "docling.document_converter"
    ).DocumentConverter
    conv = DocumentConverter()
    result = conv.convert(str(pdf))
    return result.document.export_to_markdown()


def extract_marker(pdf: Path) -> str:
    marker_convert = importlib.import_module("marker.converters.pdf")
    PdfConverter = marker_convert.PdfConverter
    marker_models = importlib.import_module("marker.models")
    models = marker_models.create_model_dict()
    converter = PdfConverter(artifact_dict=models)
    rendered = converter(str(pdf))
    return rendered.markdown if hasattr(rendered, "markdown") else str(rendered)


EXTRACTORS = {
    "pypdf": extract_pypdf,
    "pymupdf4llm": extract_pymupdf4llm,
    "docling": extract_docling,
    "marker": extract_marker,
}


def run_one(name: str, fn, pdf: Path, out_dir: Path) -> dict:
    out_dir.mkdir(parents=True, exist_ok=True)
    out_file = out_dir / f"{pdf.stem}.md"
    t0 = time.perf_counter()
    try:
        text = fn(pdf)
    except ImportError as e:
        return {"extractor": name, "pdf": pdf.name, "status": f"missing: {e.name}"}
    except Exception as e:  # noqa: BLE001
        return {"extractor": name, "pdf": pdf.name, "status": f"error: {e}"}
    dt = time.perf_counter() - t0
    out_file.write_text(text, encoding="utf-8")
    return {
        "extractor": name,
        "pdf": pdf.name,
        "status": "ok",
        "seconds": round(dt, 2),
        "chars": len(text),
        "readable": extraction_looks_readable(text),
    }


def main() -> int:
    pdfs = []
    for name in CORPUS:
        p = INBOX / name
        if not p.exists():
            print(f"MISSING: {p}", file=sys.stderr)
            return 1
        pdfs.append(p)

    results = []
    for name, fn in EXTRACTORS.items():
        print(f"\n=== {name} ===", flush=True)
        for pdf in pdfs:
            print(f"  {pdf.name} ...", end=" ", flush=True)
            r = run_one(name, fn, pdf, OUT_DIR / name)
            results.append(r)
            if r["status"] == "ok":
                print(f"{r['seconds']}s  {r['chars']:>7d} chars  "
                      f"readable={r['readable']}")
            else:
                print(r["status"])

    print(f"\n{'extractor':14s} {'pdf':52s} {'status':10s} {'sec':>6s} "
          f"{'chars':>8s}  readable")
    for r in results:
        print(f"{r['extractor']:14s} {r['pdf'][:52]:52s} {r['status'][:10]:10s} "
              f"{r.get('seconds', ''):>6} {r.get('chars', ''):>8}  "
              f"{r.get('readable', '')}")

    print(f"\nOutputs in: {OUT_DIR}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
