# PDF extractor evaluation — results (issue #16)

Companion to `2026-10-22-pdf-extractor-eval-design.md`. Harness in
`scripts/eval_extractors.py`; raw outputs in `logs/extractor-eval/`.

## Recommendation

**Primary: `docling`. Fallback: `pypdf`.** Drop the `marker_single`
subprocess reference — do not install `marker-pdf`.

## Pre-finding worth remembering

`pip install pymupdf4llm` currently installs version **2.0, which is a
code-less stub distribution** (dist-info with an empty RECORD, no package
directory). The real package is `pymupdf4llm<1.1` (0.3.4 at time of
writing). The first run of the harness reported `pymupdf4llm` as "missing"
until this was spotted. Pin `pymupdf4llm<1.1` in any future comparison.

## Measurements

Harness run on 4 inbox PDFs (table-heavy, mixed, figure-heavy, long text).
Marker not installed (GPU-dependent, deliberate skip — see below).

| Extractor | Avg sec/PDF | Avg chars | h1 | h2 | h3 | Pipe-table rows | Bullets | Figure refs |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| pypdf (baseline) | 0.6 | 62 329 | 0 | 0 | 0 | 0 | 3 | 50 |
| pymupdf4llm 0.3.4 | 5.2 | 68 000 | 3 | 3 | 8 | 66 | 11 | 48 |
| docling 2.142 | 68.3 | 68 007 | 0 | 99 | 0 | 86 | 202 | 50 |

(Totals summed across the four PDFs; figure-ref count is `(?:Figure\|Fig\|Table)\s+\d` mentions in the text.)

## Qualitative

Picked a `Table 1 — Economic aspects of corporate sustainability` region
(table-heavy PDF) and compared verbatim:

- **pypdf**: all cells concatenated into one run-on paragraph. Unusable
  for a KB that wants to cross-link concepts.
- **pymupdf4llm**: adds some `**bold**` emphasis and strips headers but
  still collapses the table rows into prose. Headings surface sometimes.
- **docling**: emits an actual Markdown pipe table with one row per table
  row and column text intact. Also tags most section headings as `##`.

Reading the four outputs end-to-end confirms the counts: docling is the
only one that produces something an LLM downstream can reliably pattern
on as a table.

Score (0 missing / 1 partial / 2 good), summed across the four PDFs:

| Dimension | pypdf | pymupdf4llm | docling |
|---|---:|---:|---:|
| Headings | 0 | 4 | 7 |
| Tables | 0 | 3 | 7 |
| Lists | 0 | 2 | 7 |
| Figure refs | 4 | 4 | 4 |
| Reading order | 4 | 6 | 7 |
| Speed | 8 | 7 | 2 |
| Install weight | 8 | 7 | 3 |
| **Total** | **24** | **33** | **37** |

Docling wins on quality by a wide margin and loses on speed/install
weight. Ingest is already paced by Claude enrichment calls (tens of
seconds per source via the merge/synthesis path), so adding ~70 s per
source is a modest step on top. The install adds `torch` (~1 GB) but
runs CPU-only without a GPU, which fits this host.

## Marker decision

**No.** `marker` is left out. Rationale:

- Docling already clears the quality bar the issue was concerned about
  (tables, headings, reading order). Marker's extra accuracy is not
  needed for a wiki ingest.
- Marker requires GPU for reasonable speed and ~1 GB of model weights
  on first run — a strictly bigger install than docling for marginal
  gain.
- The dead `marker_single` subprocess call in `ingest.py` is removed
  rather than kept behind a conditional.

If a future source class (e.g. complex multi-column scientific papers)
makes docling look thin, re-run the harness with `marker` added rather
than putting it back blindly.

## Wire-in (landed on `feature/pdf-extractor-eval`)

- `kb-framework/pipeline/ingest.py` — `extract_markdown()` rewritten:
  docling as primary (direct Python call), pypdf as last-resort
  fallback; `marker_single` subprocess branch removed.
- `EurSuRA-kb/requirements.txt` — `docling>=2.0` added; the pypdf line
  reworded as "last-resort fallback".
- `kb-framework/README.md` — extraction line updated:
  `PDF → docling, with pypdf as last-resort fallback`.
- Harness kept at `EurSuRA-kb/scripts/eval_extractors.py` so the
  comparison is rerunnable (e.g. when adding marker later).

## Verification

- `python scripts/eval_extractors.py` — green on pypdf, pymupdf4llm,
  docling; marker reports `missing: marker` and skips cleanly.
- End-to-end smoke on one inbox PDF through `ingest.py` — tracked as
  the final step of this branch before merge.

## Out of scope (unchanged)

- Scanned / broken-font PDFs — #17 (OCR).
- Embedding extracted figures as images in the output pages — a later
  follow-up once we see how docling exposes them in `result.document`.
