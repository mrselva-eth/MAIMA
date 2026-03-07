
---

# MAIMA

### Multichain AI Intent Management Application


<img width="1919" height="905" alt="image" src="https://github.com/user-attachments/assets/d95594e4-7df6-4a1c-98fe-5fe65fefe407" />



**AI-Powered Intent-Based DeFi Execution** — Built with **Chainlink CRE** for trust-minimized cross-chain orchestration.  
*Chainlink CRE Hackathon Submission.*

---

# Problem Statement

Decentralized Finance (DeFi) offers powerful financial capabilities, but interacting with it especially across multiple blockchains remains unnecessarily complex. Performing even a simple cross-chain swap requires users to manually evaluate decentralized exchanges, bridges, gas fees, slippage, and liquidity conditions across fragmented ecosystems. This process demands significant technical knowledge and introduces friction, inefficiency, and risk. As a result, many potential users are discouraged from participating in DeFi. What the ecosystem lacks is an intelligent, trust minimized system that can understand user intent and automatically orchestrate optimized cross-chain transactions on their behalf.

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
AI_API_KEY=
CRE_CLI_PATH=bin/cre.exe
```

LI.FI API key is configured in `cre/cre-swap/config.staging.json` and `cre/cre-bridge/config.staging.json` (copy from `config.staging.example.json`).

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

# Upcoming Implementation

We are actively working on extending MAIMA beyond its current capabilities. The following features represent our roadmap for bringing intent-based DeFi to production.

---

### 1. MAIMA DeFi Execution Layer

Today, the API orchestrates CRE workflows and the frontend handles user interaction. We plan to introduce a dedicated **execution layer** that sits between the ranked route output and the user's wallet. This layer will standardize transaction submission, handle chain-specific signing flows, manage gas estimation and retries, and provide a consistent interface for tracking execution status across multiple chains. The goal is to make MAIMA's backend as reliable and user-friendly as the analysis layer already is.

---

### 2. Intent-Based Multi-Workflow Orchestration Engine

Right now, cre-maima delegates each request to either cre-swap or cre-bridge. The next step is a more flexible **orchestration engine** that can compose multiple workflows for a single intent. For example, a user might ask to "swap 100 USDC to ETH on Arbitrum," which could require a bridge from Base plus a swap on Arbitrum. The engine would automatically sequence and coordinate the right workflows, handle dependencies, and surface a unified execution plan. This moves MAIMA from single-step intents toward true cross-chain, multi-step flows.

---

### 3. Anti-Manipulation Intelligence System

Routing and execution are vulnerable to MEV, sandwich attacks, and stale or manipulated quotes. We intend to integrate an **anti-manipulation layer** that combines Chainlink oracles, execution-time price checks, and heuristic detection of suspicious routing behavior. Routes that deviate beyond acceptable thresholds would be flagged or filtered before the user sees them. This builds on our existing oracle verification and extends it into execution-time protection.

---

### 4. Full On-Chain Execution of DeFi Transactions

The current implementation runs CRE workflows in simulation mode. Users see real route data and rankings, but transactions are not submitted on-chain. Our roadmap includes **full on-chain execution**: real transactions, real confirmations, and real finality. This requires careful integration with the execution layer above, proper error handling for failed txs, and clear user feedback at each stage. We are designing this with security and user control as top priorities.

---

### 5. Standard DeFi Interface Alongside Chat

The chat interface is powerful for users who prefer natural language. Some users, however, are more comfortable with a **standard DeFi interface**—token selectors, amount fields, chain dropdowns, and a "Swap" or "Bridge" button. We plan to offer both: the chat for intent-native interaction and a traditional form-based UI for those who want explicit control. Both will share the same CRE backend and oracle verification, so the underlying security and ranking logic stay consistent.

---


