# MAIMA

# Problem Statement

Decentralized Finance is powerful, but interacting with it — especially across multiple blockchains — is unnecessarily complex. To perform a simple cross-chain swap, users must manually compare DEXs, bridges, gas fees, slippage, and liquidity, navigating a fragmented ecosystem that demands deep technical knowledge. This complexity creates friction, inefficiency, and risk, preventing mainstream adoption. DeFi lacks an intelligent, trust-minimized system that understands user intent and seamlessly orchestrates optimized cross-chain execution on their behalf.


## Multichain AI Intent Management Application

> AI-Powered Intent-Based DeFi Execution
> Built on Chainlink CRE for Trust-Minimized Cross-Chain Orchestration

---

##  Overview

MAIMA is an AI-powered DeFi orchestration layer that converts **natural language intents** into optimized, verified, cross-chain execution plans.

Instead of manually choosing:

* Which chain
* Which DEX
* Which bridge
* Gas strategy
* Slippage tolerance
* Route optimization

Users simply type:

```bash
swap 100 usdc to eth
bridge 1 eth to arbitrum
swap 500 usdc from base to eth on arbitrum with lowest gas
```

MAIMA:

1. Parses intent using AI
2. Aggregates routes across DEXs and bridges
3. Verifies pricing using Chainlink oracles
4. Ranks routes by gas, speed, and reliability
5. Executes through secure CRE workflows

---

##  The Core Problem

### DeFi is Powerful — But Fragmented

Users today must:

* Compare multiple DEXs (Uniswap, 1inch, KyberSwap)
* Compare bridges (Hop, Stargate, etc.)
* Estimate gas manually
* Evaluate slippage
* Trust centralized APIs for pricing
* Understand chain-specific mechanics

Even experienced users struggle.

This leads to:

*  Poor UX
*  Gas inefficiency
*  Risk of bad routing
*  Reduced adoption

---

##  The MAIMA Solution

MAIMA introduces **Intent-Based DeFi Execution**.

###  Step 1 — AI Intent Parsing

OpenAI converts natural language into a structured `Intent`:

```json
{
  "action": "swap",
  "fromToken": "USDC",
  "toToken": "ETH",
  "amount": 100,
  "sourceChain": "Base",
  "destinationChain": "Arbitrum"
}
```

---

###  Step 2 — CRE Orchestration

All backend logic runs inside **Chainlink Runtime Environment (CRE)**.

CRE enables:

* Multi-step workflows
* Cross-chain orchestration
* Decentralized execution logic
* Modular worker spawning
* Oracle-triggered validation

MAIMA uses:

* `cre-maima` → orchestrator
* `cre-swap` → swap analysis worker
* `cre-bridge` → bridge analysis worker

---

###  Step 3 — Multi-Protocol Aggregation

We use:

* **LI.FI** advanced routes API
* 20+ chains
* 250+ DEXs and bridges

Each route includes:

* Gas cost (USD)
* Output amount
* Execution time
* Protocol metadata

---

###  Step 4 — Oracle Verification

Every quoted route is verified using:

* **Chainlink Price Feeds**

If deviation is detected between:

* LI.FI quoted output
* Chainlink oracle fair value

The route is flagged.

This ensures:

* Transparency
* Trust minimization
* Protection against manipulated pricing

---

###  Step 5 — Smart Ranking Engine

Routes are scored by:

| Factor         | Weight |
| -------------- | ------ |
| Gas Cost       | 40%    |
| Execution Time | 30%    |
| Reliability    | 30%    |

Lower score = Better route.

Reliability uses protocol whitelisting:

* Uniswap
* 1inch
* Curve
* KyberSwap
* Paraswap

---

##  Architecture

```
User Input
   ↓
Next.js API
   ↓
cre-maima (Orchestrator)
   ↓
cre-swap / cre-bridge
   ↓
LI.FI (Route Aggregation)
   ↓
Chainlink Price Feed Verification
   ↓
Ranking Engine
   ↓
Frontend Report
   ↓
Wallet Execution
```

All computation runs inside CRE workflows.

The API only routes and spawns execution.

---

##  Key Features

###  AI Intent Layer

Natural language → structured DeFi actions

###  Cross-Chain Automation

Swap + Bridge orchestration in one system

###  Oracle Guard

Chainlink price verification before recommendation

###  Transparent Reporting

Downloadable JSON reports for auditability

###  Simulation Mode

Full workflow testing without real transactions

###  Decentralized Backend

CRE ensures trust-minimized orchestration

---

##  Tech Stack

| Layer          | Technology                           |
| -------------- | ------------------------------------ |
| Frontend       | Next.js, React, RainbowKit, viem     |
| API            | Next.js API Routes                   |
| Backend        | Chainlink CRE (TypeScript workflows) |
| AI             | OpenAI (Intent Parsing)              |
| Aggregation    | LI.FI                                |
| Price Security | Chainlink Price Feeds                |

---

##  Project Structure

```
MAIMA/
├── frontend/
│   ├── app/app/page.tsx
│   ├── app/api/maima/
│   ├── app/api/cre/
│   ├── lib/maima.ts
│   ├── lib/chainlink-oracle.ts
│   └── components/
│
├── cre/
│   ├── cre-maima/
│   ├── cre-swap/
│   └── cre-bridge/
│
└── project.yaml
```

---

##  Data Sources

### LI.FI

* Endpoint: `/v1/advanced/routes`
* Provides: routes, gasCostUSD, toAmount, duration
* Used for: Multi-protocol aggregation

### Chainlink Price Feeds

* Networks: Base, Sepolia
* Feeds: ETH/USD, USDC/USD, LINK/USD, WBTC/USD, DAI/USD
* Used for: Fair value validation

---

##  Quick Start

### Prerequisites

* Node.js 18+
* pnpm
* CRE CLI
* OpenAI API Key
* LI.FI API Key

---

### Install

```bash
pnpm install
cd frontend && pnpm install
cd ../cre/cre-maima && pnpm install
cd ../cre/cre-swap && pnpm install
cd ../cre/cre-bridge && pnpm install
```

---

### Configure `.env`

```env
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=
LIFI_API_KEY=
OPENAI_API_KEY=
CRE_SIMULATION_MODE=on
NEXT_PUBLIC_CRE_SIMULATION_MODE=on
```

---

### Compile CRE Workflows

```bash
cd cre/cre-swap
pnpm run build
```

---

### Run

```bash
cd frontend && pnpm dev
```

Open:

```
http://localhost:3000
```

---

##  Why MAIMA Matters

DeFi complexity is the biggest barrier to adoption.

MAIMA transforms:

Manual Protocol Selection → Intent-Based Execution
Fragmented Chains → Unified Orchestration
Blind Routing → Oracle-Verified Decisions

We believe the future of DeFi is:

> AI-driven, cross-chain, and intent-native.

---

## Upcoming Updates

1. We are going to create our own De-Fi Layer
2. Intent based multiple workflows creation engine
3. Integrate Anti-Intelligence System into MAIMA Architecture
4. Real Execution of De-Fi transactions