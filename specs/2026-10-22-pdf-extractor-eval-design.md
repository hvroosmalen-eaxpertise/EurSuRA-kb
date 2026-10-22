# PDF extractor evaluation (issue #16) — plan

Follow-up from #14. Pick a free/local PDF-to-Markdown extractor that preserves
tables, headings, lists, and figure references better than the current pypdf
fallback, and wire it in as the primary path.

## Current state

`kb-framework/pipeline/ingest.py:54` — `extract_markdown()`:

1. tries `marker_single` as a subprocess (300 s timeout);
2. on `FileNotFoundError` or timeout, falls through to `pypdf.PdfReader.extract_text()`;
3. raises if neither is available.

`marker_single` is **not installed on the ingest host**, so step 1 silently
fails on every run and every ingested report comes from the pypdf branch.
Pypdf drops tables (loose runs of numbers), skips figures, and loses heading
hierarchy.

## Candidates

| Tool | Install weight | Models? | Expected strengths | Risks |
|---|---|---|---|---|
| `pymupdf4llm` | pip, pure-Python wheel over `fitz` (already a transitive dep) | no | Fast, decent tables, keeps headings | Table fidelity below marker/docling on complex layouts |
| `docling` (IBM) | pip, pulls `torch` + layout model (~hundreds of MB) | yes (CPU OK) | Best-in-class table + reading-order | Heavy install; first run downloads models |
| `marker` | pip + model weights (~1 GB), GPU strongly recommended | yes | Highest quality on average | GPU dependency; cold-start cost; the "dead reference" we have today |

## Benchmark harness

**Corpus.** Four readable PDFs from the current `pipeline/inbox/`, chosen so
each stresses a different rubric dimension (all nine inbox PDFs pass the
mojibake check; scanned sources tracked by #17 stay excluded):

| PDF | Pages | Tables | Figures | Stresses |
|---|---|---|---|---|
| `Corp.Sust.Strategies-specialissueSD_Original.pdf` | 14 | 13 | 4 | Table fidelity |
| `Modeling_Corporate_Sustainability_Strate.pdf` | 8 | 5 | 2 | Mixed tables + figures |
| `The_Sustainability_Balanced_Scorecard_li.pdf` | 16 | 0 | 8 | Figure/caption retention |
| `Crafting_Corporate_Sustainability_Strate.pdf` | 31 | 0 | 1 | Heading hierarchy + reading order over many pages |

The four are listed by name in `scripts/eval_extractors.py` so the comparison
is reproducible even if `pipeline/inbox/` changes later.

**Script.** `scripts/eval_extractors.py` (outside `pipeline/` so it is not part
of production ingest). For each (extractor, pdf):

- time the extraction, record wall-clock seconds and extracted char count;
- run the output through `extraction_looks_readable()` to confirm the
  downstream guard still accepts it;
- write the Markdown under
  `logs/extractor-eval/<extractor>/<pdf-stem>.md`
  so the three outputs can be diffed side by side.

The three extractors are imported lazily, so a missing one fails only its own
pass, not the whole run.

**Scoring rubric** (manual, after the harness run; each PDF, each extractor):

| Dimension | Signal |
|---|---|
| Headings | Section hierarchy survives as `#`/`##` |
| Tables | Rows/cols map to Markdown pipe tables, not loose number runs |
| Lists | Bullets/numbered items preserved |
| Figure refs | Captions and `Figure N`/`Table N` labels retained |
| Reading order | Multi-column text does not interleave |
| Speed | Wall-clock per PDF (indicative, not a hard budget) |
| Install weight | Wheel size, first-run model download, GPU need |

Score each dimension 0 / 1 / 2 (missing / partial / good). The winning
extractor is the one with the highest sum under the constraint that install
weight stays acceptable for the ingest host.

## Decision + wire-in

After the comparison:

1. Pick the primary extractor (expected shortlist: `pymupdf4llm` for cost,
   `docling` if it meaningfully beats it on tables).
2. Rewrite `extract_markdown()`:
   - primary = chosen extractor (direct Python call, not a subprocess);
   - last-resort fallback = `pypdf` (kept so an environment without the primary
     still ingests, just at today's quality);
   - drop the dead `marker_single` subprocess branch unless `marker` wins
     (which requires actually installing it on the host — see "Marker
     decision" below).
3. Add the chosen library to `kb-framework/requirements.txt`.
4. Update the README extraction line (both repos) to name the new primary.
5. Write the comparison table + decision to
   `specs/2026-10-22-pdf-extractor-eval-results.md` (companion to this plan),
   per the specs-vs-docs convention.

## Marker decision

Treat this as a yes/no on `marker`, independent of the primary choice:

- **If the harness run shows marker clearly beating the chosen primary on
  tables/figures AND the ingest host has a usable GPU** → install `marker-pdf`
  and keep the subprocess call behind an availability check.
- **Otherwise** → delete the subprocess branch so a reader does not expect a
  tool that is never there.

Either way, the dead reference is resolved as the issue asks.

## Verification

- One-shot: `python scripts/eval_extractors.py` finishes without raising;
  outputs land under `logs/extractor-eval/`.
- Smoke test on one real inbox PDF end-to-end through `ingest.py`:
  `extraction_looks_readable()` passes, downstream enrichment still runs,
  strict build green.
- Lint hard_fail=no.

## Out of scope

- Scanned / broken-font PDFs with no recoverable text layer — tracked by #17
  (OCR path).
- Changes to enrichment (tagger, summarizer, domain-merge) — this issue is
  the extraction half only.
- Figure/image embedding into the output pages — a later follow-up once we
  know which extractor exposes them.

## Deliverables (acceptance from #16)

- [ ] Comparison + recommendation written to
  `specs/2026-10-22-pdf-extractor-eval-results.md`.
- [ ] `extract_markdown()` updated to use the chosen primary; pypdf kept as
  fallback; dead `marker_single` reference resolved.
- [ ] README extraction line updated to match.
