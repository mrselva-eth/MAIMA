# CRE Workflows

**Chainlink CRE (Chainlink Runtime Environment) workflows power the MAIMA backend.**

All analysis logic—route aggregation via LI.FI, Chainlink price verification, and protocol ranking runs inside CRE. The Next.js API is a thin orchestration layer: it queues requests, spawns workflows, and stores reports. CRE does the heavy lifting.

Built for the **Chainlink CRE Hackathon**.

---

## Architecture Overview

MAIMA uses a modular workflow architecture:

| Workflow       | Role                                                                                                  | Trigger                                                         |
| -------------- | ----------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| **cre-maima**  | Main orchestrator. Polls the API queue, checks which intents are unprocessed, and delegates to workers. | Spawned by the API when a user submits an analysis request      |
| **cre-swap**   | Swap analysis worker. Fetches routes from LI.FI, verifies prices with Chainlink, ranks protocols.     | Spawned when cre-maima detects a swap intent                    |
| **cre-bridge** | Bridge analysis worker. Same pipeline as cre-swap, tuned for cross-chain routes.                      | Spawned when cre-maima detects a bridge intent                  |



---

## Workflow Execution Flow

### 1. Request Polling

**cre-maima** runs on a cron schedule. Each run, it polls:

```
GET /api/maima?action=queue
```

to fetch all pending user intents. For each intent without a report, it delegates to the right worker.

---

### 2. Intent Delegation

Depending on the detected intent type:

- **Swap** → `POST { action: "run-swap", request }`
- **Bridge** → `POST { action: "run-bridge", request }`

The API pushes the request into the swap or bridge queue and spawns the corresponding workflow (cre-swap or cre-bridge).

---

### 3. Worker Processing

**cre-swap** or **cre-bridge** then runs the full analysis pipeline.

#### Step 1 — Fetch Pending Request

```
GET /api/maima?action=pending-swap
```

or

```
GET /api/maima?action=pending-bridge
```

---

#### Step 2 — Parse User Intent

Natural language input such as:

```
"swap 100 USDC to ETH"
```

is converted into structured parameters:

```
{
  fromToken,
  toToken,
  amount,
  chain
}
```

---

#### Step 3 — Fetch Routes from LI.FI

```
POST action: "quote"
```

The API forwards the request to:

```
LI.FI /advanced/routes
```

to retrieve possible swap or bridge routes.

---

#### Step 4 — Verify Prices via Chainlink

```
GET /api/maima?action=chainlink-price
```

Price feeds are fetched for both tokens to ensure the route output is economically reasonable.

---

#### Step 5 — Protocol Validation

Routes are filtered using a **protocol whitelist** to eliminate unsafe or unsupported bridges/swaps.

---

#### Step 6 — Route Ranking

Routes are scored using a weighted model:

| Factor               | Weight |
| -------------------- | ------ |
| Gas Cost             | 40%    |
| Execution Time       | 30%    |
| Protocol Reliability | 30%    |

The highest scoring routes are selected.

---

#### Step 7 — Generate CRE Report

The workflow returns the ranked results:

```
POST action: "cre-report"
```

The frontend then displays the **best protocols to the user for execution**.

---

## Repository Structure

```
cre/
│
├── cre-maima/          # Orchestrator
│   ├── main.ts         # Queue polling, delegation logic
│   ├── workflow.yaml   # Triggers, staging/production config paths
│   ├── config.staging.json
│   └── config.production.json
│
├── cre-swap/           # Swap worker
│   ├── main.ts         # LI.FI + Chainlink + ranking
│   ├── workflow.yaml
│   └── config.staging.json
│
├── cre-bridge/         # Bridge worker
│   ├── main.ts
│   ├── workflow.yaml
│   └── config.staging.json
│
└── README.md
```

---

## Configuration

Each workflow contains environment-specific configuration files:

```
config.staging.json
config.production.json
```

### Configuration Parameters

| Parameter          | Description                                                                             |
| ------------------ | --------------------------------------------------------------------------------------- |
| **apiBaseUrl**     | Base URL of the MAIMA API (e.g. `http://localhost:3000`)                                |
| **schedule**       | Cron schedule used when workflows run in polling mode                                   |
| **simulationMode** | When enabled, workflows return simulated execution results instead of real transactions |

Example:

```json
{
  "apiBaseUrl": "http://localhost:3000",
  "schedule": "*/30 * * * * *",
  "simulationMode": true
}
```

---

## Running Workflows

In production, workflows are **spawned automatically by the API** when users submit intents. For development and debugging, you can run them manually from the **repository root**:

```bash
cre workflow simulate cre/cre-maima --target staging-settings --non-interactive --trigger-index 0
cre workflow simulate cre/cre-swap --target staging-settings --non-interactive --trigger-index 0
cre workflow simulate cre/cre-bridge --target staging-settings --non-interactive --trigger-index 0
```

Ensure the MAIMA frontend (and API) is running at `http://localhost:3000` so workflows can reach the queue and report endpoints.

---

## Prerequisites

- **Chainlink CRE CLI** installed and on your PATH
- **Node.js 18+** and **pnpm** (or bun)
- **project.yaml** at the repository root (contains RPC config)
- **MAIMA API** running (frontend `pnpm dev`)

---

## Installing Dependencies

Each workflow depends on `@chainlink/cre-sdk`. Install in each directory:

```bash
cd cre/cre-maima && pnpm install
cd ../cre-swap && pnpm install
cd ../cre-bridge && pnpm install
```

---

## Design Principles

**Separation of concerns** — The frontend renders the UI. The API handles HTTP and workflow spawning. CRE runs all analysis and decision logic. This keeps the API thin and makes it easy to reason about security and correctness.

**Deterministic automation** — Route aggregation, price checks, and ranking are fully automated inside CRE. No manual intervention is required once an intent is submitted.

**Trust-minimized execution** — Only whitelisted protocols and Chainlink-verified prices are used. Users are protected from unsafe or manipulated routes.



