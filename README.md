# MAIMA

> **DeFi Optimistic Solution** — Swap or bridge with accuracy and gas reporting.

---

## Overview

MAIMA is a DeFi application that lets users swap or bridge tokens using natural language (e.g. *"swap 100 USDC to ETH"*). It aggregates routes from multiple DEXs and bridges via [LI.FI](https://li.fi), verifies prices with the [Chainlink](https://chain.link) Oracle Network, and ranks protocols by gas, speed, and reliability so users can choose the best option with confidence.

**Powered by Chainlink CRE** — All backend logic runs in [Chainlink Runtime Environment](https://cre.chain.link/) workflows for a decentralized, trust-minimized architecture.

---

## Features

| Feature | Description |
|--------|-------------|
| **Natural-language input** | Type requests like `swap 100 usdc to eth` or `bridge 1 eth from base to arbitrum` |
| **Multi-protocol aggregation** | Routes from Uniswap, 1inch, KyberSwap, Paraswap, and more |
| **Oracle verification** | Chainlink Price Feeds verify token prices for transparency |
| **Smart ranking** | Routes ranked by gas (40%), speed (30%), and reliability (30%) |
| **Single command run** | Start frontend only — CRE workflows run on demand |
| **Simulation mode** | Test full flow without real transactions |

---

## Quick start

**Prerequisites:** Node.js 18+, pnpm, [CRE CLI](https://docs.chain.link/cre/getting-started/cli-installation), [LI.FI API key](https://li.fi)

```bash
cd frontend && pnpm dev
```

Open **http://localhost:3000** and try: `swap 100 usdc to eth`

No separate backend process. The API spawns CRE workflows when you submit a request.

---

## How it works

1. **User submits** a request (e.g. `swap 100 usdc to eth`)
2. **API** enqueues it and spawns the CRE orchestrator (**cre-maima**)
3. **cre-maima** delegates to **cre-swap** or **cre-bridge** depending on intent
4. **cre-swap / cre-bridge** fetches routes from LI.FI, verifies prices with Chainlink, ranks protocols, and builds a report
5. **Frontend** shows top protocols with fees, duration, and oracle status
6. **User selects** a protocol and executes (simulation or real via MetaMask)

---

## Tech stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js, React, RainbowKit, viem |
| API | Next.js API Routes |
| Backend logic | Chainlink CRE (TypeScript workflows) |
| Routing | [LI.FI](https://li.fi) — multi-protocol aggregation |
| Price verification | [Chainlink Price Feeds](https://data.chain.link/) — on-chain oracles |

---

## Architecture

```
User input → API → cre-maima (orchestrator) → cre-swap / cre-bridge
                                                        │
                                                        ├── LI.FI: routes, gas, output amounts
                                                        ├── Chainlink: price verification
                                                        └── Report → Frontend → User selects & executes
```

All analysis (intent parsing, LI.FI quoting, Chainlink checks, ranking) runs in CRE. The API only routes calls and spawns workflows.

---

## Setup

**1. Install**

```bash
pnpm install
cd frontend && pnpm install
cd ../cre/cre-maima && pnpm install
cd ../cre-swap && pnpm install
cd ../cre-bridge && pnpm install
```

**2. Configure** `frontend/.env` (copy from `frontend/.env.example`)

```
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=
LIFI_API_KEY=
CRE_SIMULATION_MODE=on
NEXT_PUBLIC_CRE_SIMULATION_MODE=on
CRE_CLI_PATH=bin/cre.exe   # project-local CRE binary under frontend/bin (no global PATH needed)
```

**3. Run**

```bash
cd frontend && pnpm dev
```

---

## Data & ranking

### LI.FI

- **Endpoint:** `https://li.quest/v1/advanced/routes` (proxied via API)
- **Provides:** Routes from DEXs/bridges, `gasCostUSD`, `toAmount`, `duration`, protocol names
- **Use:** Filtered, ranked, and shown as protocol options

### Chainlink

- **Source:** On-chain Price Feed aggregators (Base, Sepolia)
- **Feeds:** ETH/USD, USDC/USD, LINK/USD, WBTC/USD, DAI/USD
- **Use:** Price verification and auditability — `accuracy: "Oracle Verified (Chainlink)"` when available

### Ranking

| Factor | Weight | Source |
|--------|--------|--------|
| Gas cost (USD) | 40% | LI.FI `gasCostUSD` |
| Execution time | 30% | LI.FI `duration` / step estimates |
| Reliability | 30% | Protocol whitelist (Uniswap, 1inch, Curve, KyberSwap, Paraswap) |

Lower score → better route.

---

## Project structure

```
MAIMA/
├── frontend/                    # Next.js app + API
│   ├── app/app/page.tsx         # Main UI
│   ├── app/api/maima/           # Queue, report, quote, step, chainlink-price
│   ├── app/api/cre/             # CRE simulation
│   ├── lib/maima.ts             # Types & stores
│   ├── lib/chainlink-oracle.ts  # Chainlink Price Feed reads
│   └── components/...           # Tracking panel, execution flow
├── cre/
│   ├── cre-maima/               # Orchestrator
│   ├── cre-swap/                # Swap analysis
│   └── cre-bridge/              # Bridge analysis
└── project.yaml                 # CRE config (RPCs)
```
