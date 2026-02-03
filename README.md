# MAIMA - Machine-AI for Managed Actions

A next-generation intent-based smart wallet with AI-powered automation, multisig security, and real-time Chainlink CRE execution. Express goals in natural language, not transactions.

**Repository:** [https://github.com/mrselva-eth/MAIMA](https://github.com/mrselva-eth/MAIMA)  
**Default branch:** `main`

## Key Features

- **Intent-Based Execution** - Express goals in natural language, not transactions
- **AI-Powered Parsing** - OpenAI GPT-4o-mini converts intents to executable actions
- **Multisig Security** - High-risk intents require multiple signatures
- **Real-Time Monitoring** - Chainlink CRE monitors conditions 24/7
- **Non-Custodial** - Your keys stay yours, no backend key storage
- **Uniswap Integration** - Automated swaps via SmartOrderRouter
- **Audit Trail** - Every execution is logged on-chain and verifiable
- **Professional UI** - Clean white & blue design with AI accent color (purple)

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (Next.js)                       │
│  - Intent Builder (natural language input)                  │
│  - Dashboard & Monitoring                                   │
│  - Wallet Connection (RainbowKit)                           │
└────────────────┬────────────────────────────────────────────┘
                 │
         ┌───────▼────────┐
         │   Backend API  │
         ├────────────────┤
         │ Intent Parser  │ ◄── OpenAI API
         │ Token Quotes   │ ◄── Uniswap SDK
         │ Validator      │
         └───────┬────────┘
                 │
      ┌──────────▼──────────┐
      │  Smart Contracts    │
      ├─────────────────────┤
      │ IntentRegistry.sol  │
      │ IntentWallet.sol    │
      │ SafetyModule.sol    │
      └──────────┬──────────┘
                 │
      ┌──────────▼──────────┐
      │  Chainlink CRE      │
      ├─────────────────────┤
      │ Monitor Workflow    │
      │ Executor Workflow   │
      │ Incident Handler    │
      └─────────────────────┘
```

## Project Structure

```
├── /app
│   ├── /api              # Backend API routes
│   │   ├── /intents      # Intent management & parsing
│   │   ├── /tokens       # Token quotes via Uniswap
│   │   └── /workflows    # CRE workflow triggers
│   ├── /dashboard        # Dashboard page
│   ├── /intents
│   │   ├── /create       # Create intent page
│   │   └── /[id]         # Intent details page
│   ├── layout.tsx        # Root layout with providers
│   ├── page.tsx          # Home page
│   └── globals.css       # Global styles & theme
├── /components
│   ├── /sections         # Page sections (Hero, Features, etc)
│   ├── /ui               # shadcn/ui components
│   ├── navbar.tsx        # Fixed navbar
│   ├── footer.tsx        # Footer
│   └── providers.tsx     # Wallet providers
├── /contracts            # Solidity contracts
├── /lib
│   ├── theme.ts          # Theme configuration
│   ├── types.ts          # TypeScript types
│   ├── uniswap.ts        # Uniswap integration
│   └── wallet-config.ts  # Wagmi/RainbowKit config
├── /intent-monitor       # CRE SDK workflow (Cron + HTTP → /api/intents/active)
├── /workflows            # CRE workflow templates (executor, incident-handler)
├── /docs                 # Documentation (incl. CRE_INTEGRATION.md)
└── .env.example          # Environment variables template
```

### Chainlink CRE

CRE (Chainlink Runtime Environment) runs **outside** this app on a DON. This repo includes:

- **`/workflows`** – Workflow templates (monitor, executor, incident-handler). Logic is ported to CRE SDK when deploying to [cre.chain.link](https://cre.chain.link).
- **`/app/api/workflows/trigger`** – API called when intents are created; in production it notifies CRE (HTTP trigger).
- **`@chainlink/cre-sdk`** (dev) – Official CRE SDK for authoring workflows; use with CRE CLI to build and deploy.

See **[docs/CRE_INTEGRATION.md](./docs/CRE_INTEGRATION.md)** for where CRE is used and how to deploy.  
**CRE hackathon:** after `cre login`, follow **[docs/HACKATHON_NEXT_STEPS.md](./docs/HACKATHON_NEXT_STEPS.md)** to simulate and deploy the **intent-monitor** workflow.

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- MetaMask or compatible Web3 wallet

### Installation

1. Clone the repository (branch `main`):
```bash
git clone https://github.com/mrselva-eth/MAIMA.git
cd MAIMA
```

2. Install dependencies:
```bash
pnpm install
# or: npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

4. Fill in required variables in `.env.local` (see `.env.example` for all options):
   - `NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID` — [WalletConnect Cloud](https://cloud.walletconnect.com)
   - `OPENAI_API_KEY` or `OPENROUTER_API_KEY` — for AI intent parsing ([OpenAI](https://platform.openai.com/api-keys) or [OpenRouter](https://openrouter.ai))

5. Run development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser

## Usage

### Creating an Intent

1. Connect your wallet using RainbowKit
2. Navigate to "Create Intent"
3. Describe what you want to do in natural language:
   - "Swap 100 USDC to ETH at best rate within 1 hour"
   - "Stake 50 SOL monthly if balance is above $1000"
   - "Bridge 500 USDT from Ethereum to Arbitrum"
4. Review the parsed intent and confirm
5. Sign the intent with your wallet
6. CRE monitors conditions and executes automatically

### Intent Lifecycle

```
Created ─► Validated ─► Active ─► Monitored ─► Executed ─► Finalized
                                                  │
                                                  └─► Expired/Revoked
```

## API Endpoints

### Intents

- `GET /api/intents?address=0x...` - List user intents
- `POST /api/intents` - Create new intent
- `GET /api/intents/[id]` - Get intent details
- `PATCH /api/intents/[id]` - Update intent

### Intent Parsing

- `POST /api/intents/parse` - Parse natural language to intent
  ```json
  {
    "userInput": "Swap 100 USDC to ETH at best rate",
    "walletAddress": "0x..."
  }
  ```

### Token Quotes

- `GET /api/tokens/quote?tokenIn=ETH&tokenOut=USDC&amount=1` - Get swap quote

### Workflows

- `POST /api/workflows/trigger` - Trigger CRE workflow

## Theme System

MAIMA uses a professional white & blue theme with AI highlighted in purple.

### Color Palette

- **Primary**: `#1e40af` (Deep Blue)
- **Secondary**: `#0f172a` (Dark Slate)
- **AI/Accent**: `#7c3aed` (Vibrant Purple)
- **Success**: `#10b981` (Emerald)
- **Warning**: `#f59e0b` (Amber)
- **Error**: `#ef4444` (Red)

Theme configuration is in `/lib/theme.ts` with CSS variables in `/app/globals.css`.

## Smart Contracts

### IntentRegistry.sol

Stores intent metadata and manages lifecycle states.

```solidity
struct Intent {
  uint256 id;
  address creator;
  uint8 intentType;
  bytes32 constraintHash;
  uint256 expiry;
  uint8 status;
}
```

### IntentWallet.sol

Executes intents via authorized CRE caller with rate limiting.

```solidity
function executeIntent(uint256 intentId, bytes calldata callData)
  onlyAuthorized
  rateLimit
  external
```

### SafetyModule.sol

Emergency controls, circuit breaker, whitelisting, time locks.

## Chainlink CRE Integration

### Intent Monitor Workflow

- Runs every 10 minutes via Cron trigger
- Evaluates price conditions, balances, time windows
- Uses DON consensus
- Updates intent status

### Intent Executor Workflow

- Triggered by HTTP webhook on approval
- Constructs calldata via Uniswap SDK
- Executes on-chain via IntentWallet
- Emits execution proof event

### Incident Handler Workflow

- Monitors for abnormal behavior
- Detects failed executions, price anomalies
- Pauses intents if risk detected
- Triggers emergency protocols

## Security Considerations

1. **No Private Keys in Backend** - All key management is wallet-based
2. **Multisig Enforcement** - Critical actions require multiple signatures
3. **On-Chain Validation** - All constraints validated on-chain
4. **Rate Limiting** - Prevent transaction spam
5. **Time Locks** - Delay for emergency actions
6. **RLS Policies** - If using Supabase, enforce row-level security

## Environment Variables Reference

See `.env.example` for all available variables:

- `NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID` - WalletConnect project ID (required)
- `OPENAI_API_KEY` - OpenAI API key for intent parsing (required)
- `NEXT_PUBLIC_API_BASE_URL` - API base URL
- `NEXT_PUBLIC_UNISWAP_ROUTER_ADDRESS` - Uniswap router address

## Development

### Running Tests

```bash
npm run test
```

### Building for Production

```bash
npm run build
npm start
```

### Code Formatting

```bash
npm run lint
npm run format
```

## Deployment

### Deploy to Vercel

```bash
vercel
```

### Set Environment Variables

In Vercel dashboard:
1. Go to Project Settings → Environment Variables
2. Add all variables from `.env.example`
3. Redeploy

## Documentation

- [Chainlink CRE Integration](./docs/CHAINLINK_CRE.md)
- [Smart Contracts](./docs/CONTRACTS.md)
- [API Reference](./docs/API.md)
- [Deployment Guide](./docs/DEPLOYMENT.md)

## What is not pushed (see `.gitignore`)

- **Secrets:** `.env`, `.env.local`, and any file with real API keys or private keys
- **Dependencies:** `node_modules/`, `.pnpm-store/`
- **Build output:** `.next/`, `out/`, `build/`, Vercel `.vercel/`
- **CRE build artifacts:** `intent-monitor/tmp.js`, `intent-monitor/tmp.wasm`, `intent-monitor/node_modules`
- **IDE/OS:** `.idea/`, `.vscode/`, `.DS_Store`, debug logs

Use `.env.example` as a template; copy to `.env.local` and fill in your values locally.

## Contributing

1. Fork the repository
2. Create a feature branch (from `main`)
3. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

- **Repo:** [github.com/mrselva-eth/MAIMA](https://github.com/mrselva-eth/MAIMA)
- Open an issue or discussion on GitHub for bugs and questions

## Roadmap

- [ ] Mainnet deployment
- [ ] Advanced constraint logic
- [ ] Cross-chain intent support
- [ ] Yield farming intents
- [ ] DAO governance integration
- [ ] Mobile app
- [ ] Browser extension

## Disclaimer

MAIMA is provided as-is without warranty. Always audit smart contracts before deploying to mainnet. Not investment advice.

---

**Built with ❤️ for the Chainlink CRE Hackathon**
