
---

# MAIMA

### Multichain AI Intent Management Application

**AI-Powered Intent-Based DeFi Execution**
Built with **Chainlink CRE for Trust-Minimized Cross-Chain Orchestration**

---

# Problem Statement

Decentralized Finance (DeFi) offers powerful financial capabilities, but interacting with it—especially across multiple blockchains—remains unnecessarily complex. Performing even a simple cross-chain swap requires users to manually evaluate decentralized exchanges, bridges, gas fees, slippage, and liquidity conditions across fragmented ecosystems. This process demands significant technical knowledge and introduces friction, inefficiency, and risk. As a result, many potential users are discouraged from participating in DeFi. What the ecosystem lacks is an intelligent, trust-minimized system that can understand user intent and automatically orchestrate optimized cross-chain transactions on their behalf.

---

# Overview

MAIMA is an **AI-powered DeFi orchestration layer** that converts **natural language intents** into optimized and verified cross-chain execution plans.

Instead of manually selecting:

* Which blockchain to use
* Which decentralized exchange to trade on
* Which bridge to transfer assets through
* Gas optimization strategies
* Slippage tolerances
* Route optimization

Users simply type a command such as:

```
swap 100 usdc to eth
bridge 1 eth to arbitrum
swap 500 usdc from base to eth on arbitrum with lowest gas
```

MAIMA automatically:

1. Parses the user intent using AI
2. Aggregates routes across DEXs and bridges
3. Verifies price data using Chainlink oracles
4. Ranks routes based on cost, speed, and reliability
5. Executes the transaction through secure CRE workflows

---

# The Core Problem

### DeFi is Powerful — But Fragmented

Today, users must manually:

* Compare multiple DEXs (Uniswap, 1inch, KyberSwap)
* Evaluate bridge protocols (Hop, Stargate, etc.)
* Estimate transaction gas costs
* Manage slippage risks
* Trust centralized APIs for routing data
* Understand chain-specific mechanics

Even experienced users face challenges navigating these systems.

This results in:

* Poor user experience
* Inefficient routing and higher gas costs
* Increased risk of unfavorable trades
* Slower adoption of decentralized finance

---

# The MAIMA Solution

MAIMA introduces **Intent-Based DeFi Execution**, allowing users to interact with DeFi using natural language while the system handles complex routing decisions.

---

## Step 1 — AI Intent Parsing

Natural language inputs are converted into structured transaction intents using OpenAI.

Example:

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

## Step 2 — CRE Orchestration

All backend logic runs inside the **Chainlink Runtime Environment (CRE)**.

CRE enables:

* Multi-step decentralized workflows
* Cross-chain orchestration
* Automated execution pipelines
* Modular worker spawning
* Oracle-driven validation

MAIMA uses the following workflows:

* **cre-maima** — orchestration workflow
* **cre-swap** — swap analysis worker
* **cre-bridge** — bridge analysis worker

---

## Step 3 — Multi-Protocol Aggregation

MAIMA aggregates liquidity routes using **LI.FI**.

Supported ecosystem scale:

* **20+ blockchains**
* **250+ DEXs and bridge protocols**

Each route includes:

* Gas cost (USD)
* Expected output amount
* Estimated execution time
* Protocol metadata

---

## Step 4 — Oracle Verification

Each quoted route is verified using **Chainlink Price Feeds**.

The system compares:

* LI.FI quoted output
* Chainlink oracle price

If a significant deviation is detected, the route is flagged.

This ensures:

* Transparent pricing
* Trust-minimized routing
* Protection against manipulated price quotes

---

## Step 5 — Smart Ranking Engine

Routes are scored based on weighted metrics:

| Factor         | Weight |
| -------------- | ------ |
| Gas Cost       | 40%    |
| Execution Time | 30%    |
| Reliability    | 30%    |

Lower score indicates a better route.

Reliability is determined using protocol whitelisting including:

* Uniswap
* 1inch
* Curve
* KyberSwap
* Paraswap

---

# Architecture

```
User Input
   ↓
Next.js API
   ↓
cre-maima (Orchestrator)
   ↓
cre-swap / cre-bridge
   ↓
LI.FI Route Aggregation
   ↓
Chainlink Price Feed Verification
   ↓
Ranking Engine
   ↓
Frontend Analysis Report
   ↓
Wallet Transaction Execution
```

All computation occurs inside **CRE workflows**, while the API layer only handles request routing and workflow spawning.

---

# Key Features

### AI Intent Layer

Converts natural language into structured DeFi actions.

### Cross-Chain Automation

Supports both swaps and bridging across multiple blockchains.

### Oracle Guard

Uses Chainlink price feeds to validate routing outcomes.

### Transparent Reporting

Users can download a complete JSON analysis report for transparency.

### Simulation Mode

Developers can test the entire workflow pipeline without executing real blockchain transactions.

### Decentralized Backend Logic

CRE ensures that the orchestration logic remains modular and trust-minimized.

---

# Tech Stack

| Layer       | Technology                           |
| ----------- | ------------------------------------ |
| Frontend    | Next.js, React, RainbowKit, viem     |
| API         | Next.js API Routes                   |
| Backend     | Chainlink CRE (TypeScript Workflows) |
| AI          | OpenAI (Intent Parsing)              |
| Aggregation | LI.FI                                |
| Oracle Data | Chainlink Price Feeds                |

---

# Project Structure

```
MAIMA/
│
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

# Data Sources

### LI.FI

* Endpoint: `/v1/advanced/routes`
* Provides: routing data, gas cost, expected output amount, execution time
* Purpose: Multi-protocol route aggregation

### Chainlink Price Feeds

Supported networks:

* Base
* Sepolia

Example feeds:

* ETH / USD
* USDC / USD
* LINK / USD
* WBTC / USD
* DAI / USD

Used for **price verification and routing validation**.

---

## Documentation

- **[Architecture Guide](ARCHITECTURE.md)** — Detailed system design and data flow.
- **[Development Guide](DEVELOPMENT.md)** — Setup, workflow development, and testing.

---

## Quick Start

## Prerequisites

* Node.js 18+
* pnpm
* Chainlink CRE CLI
* OpenAI API Key
* LI.FI API Key

---

## Installation

Install dependencies:

```bash
pnpm install
```

Then install dependencies for each module:

```bash
cd frontend && pnpm install
cd ../cre/cre-maima && pnpm install
cd ../cre/cre-swap && pnpm install
cd ../cre/cre-bridge && pnpm install
```

---

## Configure Environment Variables

Create a `.env` file:

```
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=
LIFI_API_KEY=
OPENAI_API_KEY=
CRE_SIMULATION_MODE=on
NEXT_PUBLIC_CRE_SIMULATION_MODE=on
CRE_CLI_PATH=bin/cre.exe
```

---

## Compile CRE Workflows

```
cd cre/cre-swap
pnpm run build
```

---

## Run the Application

```
cd frontend
pnpm dev
```

Open the application:

```
http://localhost:3000
```

---

# Why MAIMA Matters

DeFi complexity remains one of the largest barriers to mainstream adoption.

MAIMA transforms the current ecosystem:

| Current DeFi                 | MAIMA                     |
| ---------------------------- | ------------------------- |
| Manual Protocol Selection    | Intent-Based Execution    |
| Fragmented Multi-Chain Tools | Unified Orchestration     |
| Blind Routing Decisions      | Oracle-Verified Execution |

We believe the future of decentralized finance is:

> **AI-driven, cross-chain, and intent-native.**

---

# Upcoming Updates

Planned improvements for the MAIMA ecosystem include:

1. Development of a dedicated **MAIMA DeFi execution layer**
2. **Intent-based multi-workflow orchestration engine**
3. Integration of an **anti-manipulation intelligence system**
4. Full **on-chain execution of DeFi transactions**
5. Optional **standard DeFi interface** alongside the chat-based interface

---


