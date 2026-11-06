# NEXUS Model Evaluation Harness

Purpose: run identical NEXUS EOC cases repeatedly against one or more model providers and measure contract compliance, regression behavior, consistency, latency, and token usage.

## Safety / scope
This utility is isolated under `eval/`. It does not modify NEXUS live exercise state, `/api/chat`, Team Mode, AAR logic, map behavior, or local-plan storage.

## Requirements
- Node 20+ (uses built-in `fetch`)
- OpenAI: `OPENAI_API_KEY` and an exact pinned `OPENAI_EVAL_MODEL`
- Anthropic optional: `ANTHROPIC_API_KEY` and an exact pinned `ANTHROPIC_EVAL_MODEL`

Do not use `latest` aliases for benchmark runs. Pin the exact model identifier so a future provider change does not invalidate the comparison.

## Commands
From the repo root after installation:

```bash
npm run eval:nexus:dry
npm run eval:nexus
npm run eval:nexus -- --runs=10 --category=flash-card
npm run eval:nexus -- --providers=openai,anthropic --runs=10
npm run eval:nexus -- --case=flash-001 --runs=20
npm run eval:nexus:mock
```

PowerShell environment examples:

```powershell
$env:OPENAI_API_KEY="YOUR_KEY"
$env:OPENAI_EVAL_MODEL="YOUR_EXACT_MODEL_ID"
npm run eval:nexus -- --runs=10
```

Anthropic comparison:

```powershell
$env:ANTHROPIC_API_KEY="YOUR_KEY"
$env:ANTHROPIC_EVAL_MODEL="YOUR_EXACT_CLAUDE_MODEL_ID"
npm run eval:nexus -- --providers=openai,anthropic --runs=10
```

## First benchmark set
12 cases across:
- Standard NEXUS turns
- Flash-card dispatches
- Local-plan discipline

The Wake County accessible-transportation case is included as `flash-001`, specifically to catch regressions such as `SOURCE: ... | CONDITION: ...` and overly dense cards.

## Scoring
Version 1 uses deterministic checks for:
- valid JSON and required NEXUS fields
- lifeline enums
- tactical-command drift
- prescriptive coaching language
- flash-card word/sentence limits
- legacy `SOURCE | CONDITION` presentation
- neutral dispatch language
- preservation of scenario facts
- local-plan grounding tokens
- plan silence
- invented thresholds or requirements
- fabricated page/section citations
- uncertainty preservation

Results are written to `eval/results/` as HTML, CSV, and JSON.

## Mock mode
`npm run eval:nexus:mock` tests the harness without calling an external API. This is useful after changing validators or cases.

## Next phase
After the deterministic harness is stable, add a separate human-scoring file for Deputy voice, realism, decision pressure, no spoon-feeding, and usefulness. Keep human quality scores separate from hard contract failures.
