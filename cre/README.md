
# CRE Workflows

**Chainlink CRE (Chainlink Runtime Environment) workflows powering the MAIMA backend automation layer.**

All **analysis logic** — including routing via LI.FI, Chainlink price verification, and protocol ranking — is executed inside CRE workflows. The frontend API acts only as an **orchestration layer and gateway**, while CRE performs the computational and decision logic.

---

# Architecture Overview

MAIMA uses a **modular workflow architecture** built on Chainlink CRE.

| Workflow       | Description                                                                                          | Trigger                                                  |
| -------------- | ---------------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| **cre-maima**  | Main orchestrator workflow. Polls incoming requests and delegates tasks to the appropriate workflow. | Triggered by API when a user submits an analysis request |
| **cre-swap**   | Performs swap route analysis including LI.FI routing, price verification, and ranking.               | Spawned when a swap request is detected                  |
| **cre-bridge** | Performs cross-chain bridge analysis with route validation and ranking.                              | Spawned when a bridge request is detected                |



---

# Workflow Execution Flow

### 1. Request Polling

The **cre-maima** workflow periodically polls the API queue:

```
GET /api/maima?action=queue
```

It retrieves user intents that have not yet been processed.

---

### 2. Intent Delegation

For each pending request:

* **Swap request**

  ```
  POST { action: "run-swap", request }
  ```

* **Bridge request**

  ```
  POST { action: "run-bridge", request }
  ```

The API places the request into the appropriate queue and spawns the corresponding workflow.

---

### 3. Workflow Processing

The **cre-swap** or **cre-bridge** workflow then executes the analysis pipeline.

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

# Repository Structure

```
cre/
│
├── cre-maima/          # Orchestrator workflow
│   ├── main.ts
│   ├── config.staging.json
│   ├── config.production.json
│   └── workflow.yaml
│
├── cre-swap/           # Swap analysis workflow
│   ├── main.ts
│   ├── config.staging.json
│   └── workflow.yaml
│
├── cre-bridge/         # Bridge analysis workflow
│   ├── main.ts
│   ├── config.staging.json
│   └── workflow.yaml
│
└── README.md
```

---

# Configuration

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

# Running Workflows

Workflows are **normally spawned automatically by the API**.

However, they can also be executed manually for **testing or debugging**.

Run from the repository root:

```bash
cre workflow simulate cre/cre-maima --target staging-settings --non-interactive --trigger-index 0
```

```bash
cre workflow simulate cre/cre-swap --target staging-settings --non-interactive --trigger-index 0
```

```bash
cre workflow simulate cre/cre-bridge --target staging-settings --non-interactive --trigger-index 0
```

---

# Prerequisites

Before running workflows, ensure the following are installed and configured:

* **Chainlink CRE CLI**
* **Node.js / pnpm**
* **project.yaml** configured at the repository root
* **MAIMA API server running**

Example API:

```
http://localhost:3000
```

---

# Installing Dependencies

Each workflow uses the **Chainlink CRE SDK**.

Install dependencies in each workflow directory:

```bash
cd cre/cre-maima
pnpm install
```

```bash
cd ../cre-swap
pnpm install
```

```bash
cd ../cre-bridge
pnpm install
```

---

# Key Design Principles

MAIMA's CRE architecture follows three core principles:

**1. Separation of Concerns**
Frontend handles UI, API handles orchestration, CRE handles analysis and automation.

**2. Deterministic Automation**
All route analysis and ranking logic runs inside CRE workflows.

**3. Secure Protocol Selection**
Only trusted protocols and verified price feeds are used in route evaluation.



