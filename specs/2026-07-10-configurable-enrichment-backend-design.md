---
title: Configurable per-task enrichment backend
issue: 14
date: 2026-07-10
status: approved
---

# Configurable per-task enrichment backend

## Context

`kb-framework/pipeline/ingest.py` processes a source (PDF or Markdown) in two
stages:

| Stage | Today | Cost | Images/tables/diagrams? |
|---|---|---|---|
| **Extract** PDF → raw Markdown | `marker-pdf` → `pypdf` text fallback | Free (local) | marker: partial; pypdf: text only |
| **Enrich** raw MD → tagged wiki page | Claude Sonnet, ~4 calls/source | **Paid** | n/a (operates on text) |

The cost the issue targets lives entirely in **enrichment** — four
`call_claude` invocations per source: tagger, Wikipedia-style rewrite,
domain-merge, glossary. Extraction is already free.

Local enrichment is viable on the available hardware (GTX 1660 Ti, ~6 GB VRAM)
using Ollama. Of the installed models, `qwen3:8b` (5.2 GB) is the only strong
*general/instruct* model that fits VRAM; the `-coder` models are wrong for
prose and the 30b model does not fit.

The sub-tasks do not degrade equally on a local 8b model. Tagger, rewrite, and
glossary are forgiving; **domain-merge** (merge-not-overwrite reasoning over an
existing page, including wikilink integrity) is the risky one and stays
on Claude.

## Scope

Enrichment only. PDF extraction (`marker` → `pypdf`) is untouched.
Vision-model diagram/table captioning is a separate future investigation.

## Decisions

1. **Per-task backend map** — each enrichment call names its backend + model in
   config (data, not hardcoded). Chosen over a coarse toggle so any task can be
   flipped without code changes.
2. **Default = all-Claude** — a KB with no `enrich:` block behaves exactly as
   today. Opting into local is a deliberate per-KB choice; KBs without Ollama
   are never surprised.
3. **Fail loud** — if a task is routed to Ollama but the daemon is unreachable
   or the model is missing, ingest raises and the source is routed to
   `failed/`. No silent fallback to paid Claude calls.

## Config

New `enrich:` block in `config/kb.yaml`. This KB opts into the hybrid:

```yaml
enrich:
  backends:
    claude: { model: claude-sonnet-4-6 }
    ollama: { model: qwen3:8b, host: http://localhost:11434, num_ctx: 8192 }
  tasks:
    tagger:   ollama
    rewrite:  ollama
    merge:    claude     # kept on Claude — the risky merge-not-overwrite step
    glossary: ollama
```

Built-in default (applied when the block or any key is absent):

```python
DEFAULT_ENRICH = {
    "backends": {"claude": {"model": "claude-sonnet-4-6"}},
    "tasks": {"tagger": "claude", "rewrite": "claude",
              "merge": "claude", "glossary": "claude"},
}
```

### Configurable timeout (added 2026-07-29)

The Ollama backend HTTP request timeout was **600s** (hardcoded). On machines
without GPU acceleration, `qwen3:8b` can take >10 min to respond — especially
for large PDFs (e.g. 1.5M chars extracted). The timeout is now:

- Configurable per-KB via `enrich.backends.ollama.timeout` in `config/kb.yaml`
- Default **1200s** (20 min) in code
- Set to **1200s** (20 min) for EurSuRA-kb

PDFs exceeding 500K extracted characters produce a `LARGE_SOURCE` warning at
ingestion time so operators know why processing is slow.

**Rationale:** Hardcoding 600s made large-PDF ingestion reliably fail on the
available hardware. Making it configurable avoids code changes when the
right value depends on hardware, model size, and document length.

**Calibration (2026-07-30):** benchmarked a near-ceiling enrichment call
(input at ~70% of `num_ctx=8192`, ~22K chars) against `qwen3:8b` on the GPU:
cold 145s, warm 166s — model load is negligible (5.2GB fits the 6GB VRAM),
generation dominates. The old 600s timeouts were pre-GPU-fix (iGPU, ~3–4×
slower). 1200s = ~7× the measured worst case and 2× the historical 600s
failure point: generous enough never to false-fail a legitimate call, bounded
enough to fail a genuinely hung request in 20 min.

## Components (in `ingest.py`)

1. `load_enrich_config(kb)` — read the `enrich:` block, deep-merge over
   `DEFAULT_ENRICH`. Missing block/keys resolve to `claude`.
2. `call_ollama(system_prompt, user_content, model, host, num_ctx, timeout, temperature)` — POST
   `{host}/api/chat` with `stream=false`, `options.num_ctx`, and configurable HTTP
   `timeout` (default 1200s); return `message.content`. Unreachable host, non-200,
   or model-not-found → `RuntimeError`.
3. `enrich_call(task, system_prompt, user_content, cfg, label)` — dispatcher:
   `tasks[task]` → backend name → model, routes to `call_claude` or
   `call_ollama`. Unknown backend name → `RuntimeError`.
4. The four existing call sites (tagger, rewrite, merge, glossary) call
   `enrich_call("<task>", …)` instead of `call_claude` directly.

## Data flow

Unchanged except the LLM call is indirected through `enrich_call`. The
`RuntimeError` on backend failure propagates to the existing per-source handler,
which routes the source to `failed/` and leaves the inbox intact.

## Testing

No live API or Ollama calls (per the KB verification approach — pipeline changes
are tested without paid/live calls):

- Dispatcher selects the configured backend per task; unknown backend → error.
- Absent `enrich:` block → all four tasks resolve to `claude` (backward-compat).
- `call_ollama` with mocked HTTP: correct request payload shape; connection
  error → `RuntimeError`.

## Cost effect

4 Claude calls/source → 1 (merge only): ~75% reduction, merge quality preserved.
