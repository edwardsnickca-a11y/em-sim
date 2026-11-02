# NEXUS EOC OpenAI Deployment Parity Report

No secret values are written to this report.

| Key | Action | Referenced by |
|---|---|---|
| `ANTHROPIC_API_KEY` | **DO NOT COPY** — Claude-only credential | `apply_openai_provider_patch.cjs` |
| `DEV` | **PARITY** — Copy same value and Vercel scope from existing EOC | `src/components/dev/TestConsole.jsx` |
| `OPENAI_API_KEY` | **OPENAI REQUIRED** — Use the dedicated OpenAI API key | `api/chat.js`, `apply_openai_provider_patch.cjs` |
| `OPENAI_MODEL` | **OPENAI OPTIONAL** — Set to gpt-5.6 | `api/chat.js`, `apply_openai_provider_patch.cjs` |
| `REDIS_URL` | **PARITY** — Copy same value and Vercel scope from existing EOC | `api/chat.js`, `api/local-plan.js`, `api/team-room.js` |
| `VERCEL_ENV` | **PARITY** — Copy same value and Vercel scope from existing EOC | `src/components/dev/TestConsole.jsx`, `vite.config.js` |
| `VITE_CARTO_BASEMAP_KEY` | **PARITY** — Copy same value and Vercel scope from existing EOC | `src/App.jsx` |
| `VITE_LOCAL_PLAN_API_URL` | **PARITY** — Copy same value and Vercel scope from existing EOC | `src/lib/localPlanProcessing.js` |
| `VITE_POSTHOG_HOST` | **PARITY** — Copy same value and Vercel scope from existing EOC | `src/main.jsx` |
| `VITE_POSTHOG_KEY` | **PARITY** — Copy same value and Vercel scope from existing EOC | `src/main.jsx` |

## Local env-name check

- `ANTHROPIC_API_KEY`
- `VITE_POSTHOG_HOST`
- `VITE_POSTHOG_KEY`

## Deployment rule

Copy every **PARITY** key from the existing EOC Vercel project using the same value and environment scope. Do not copy `ANTHROPIC_API_KEY`. Add `OPENAI_API_KEY`. Set `OPENAI_MODEL=gpt-5.6` for an explicit model pin.
