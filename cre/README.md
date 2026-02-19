# CRE Workflows

Chainlink CRE (Chainlink Runtime Environment) workflows for MAIMA backend logic. All analysis (LI.FI routing, Chainlink price verification, protocol ranking) runs here. The frontend API only orchestrates and proxies external calls.

---

## Workflows

| Workflow | Role | Triggers |
|----------|------|----------|
| **cre-maima** | Orchestrator — polls queue, delegates to swap or bridge | Spawned by API on each analyze request |
| **cre-swap** | Swap analysis — LI.FI quote, Chainlink, ranking, report | Spawned by API when cre-maima delegates a swap |
| **cre-bridge** | Bridge analysis — same flow for cross-chain | Spawned by API when cre-maima delegates a bridge |

---

## Flow

1. **cre-maima** polls `GET /api/maima?action=queue`
2. For each request without a report:
   - Swap → POST `{ action: "run-swap", request }` to API
   - Bridge → POST `{ action: "run-bridge", request }` to API
3. API pushes to `pending-swap` or `pending-bridge` and spawns **cre-swap** or **cre-bridge**
4. **cre-swap / cre-bridge**:
   - GET `pending-swap` or `pending-bridge`
   - Parse intent from prompt
   - POST `action: "quote"` → API forwards to LI.FI `advanced/routes`
   - GET `chainlink-price` for from/to tokens
   - Validate protocols (whitelist)
   - Rank by gas (40%), time (30%), reliability (30%)
   - POST `action: "cre-report"` with report

---

## Structure

```
cre/
├── cre-maima/          # Orchestrator
│   ├── main.ts
│   ├── config.staging.json
│   ├── config.production.json
│   └── workflow.yaml
├── cre-swap/           # Swap analysis
│   ├── main.ts
│   ├── config.staging.json
│   └── ...
├── cre-bridge/         # Bridge analysis
│   ├── main.ts
│   └── ...
└── README.md
```

---

## Config

Each workflow has `config.staging.json` and `config.production.json`:

- **apiBaseUrl** — Frontend API URL (e.g. `http://localhost:3000`)
- **schedule** — Cron expression (used when running as a loop)
- **simulationMode** — When true, report includes `simulationMode: true` so frontend runs simulated execution

---

## Running

Workflows are spawned by the API. To run manually (e.g. debugging):

From repo root:

```bash
cre workflow simulate cre/cre-maima --target staging-settings --non-interactive --trigger-index 0
cre workflow simulate cre/cre-swap --target staging-settings --non-interactive --trigger-index 0
cre workflow simulate cre/cre-bridge --target staging-settings --non-interactive --trigger-index 0
```

**Prerequisites:**
- CRE CLI installed
- `project.yaml` at repo root (RPCs)
- Frontend API running at `apiBaseUrl`

---

## Dependencies

Each workflow uses `@chainlink/cre-sdk`. Install:

```bash
cd cre/cre-maima && pnpm install
cd ../cre-swap && pnpm install
cd ../cre-bridge && pnpm install
```
