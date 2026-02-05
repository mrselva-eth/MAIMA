# MAIMA — DeFi Optimistic Solution Handler

MAIMA analyzes your swap and bridge needs and returns a **report** (accuracy, gas fee, optimistic estimates). Describe what you want in natural language, see **process tracking** (protocols checked, choose one), and get the best option. Deploy workflows to Chainlink when you have Early Access.

**Repository:** [https://github.com/mrselva-eth/MAIMA](https://github.com/mrselva-eth/MAIMA)  
**Default branch:** `main`

## Key features

- **Chat interface (App)** – Describe swap or bridge in natural language (e.g. “Swap 100 USDC to ETH”, “Bridge 500 USDT from Ethereum to Arbitrum”). **Wallet connect required** to access the app.
- **Report** – Accuracy, gas fee estimate, optimistic execution, and top bridges/swaps.
- **Process tracking** – In the app, track protocols as they’re checked, then choose one and see the result.
- **CRE workflows** – Under `cre/`: **cre-maima** (main), **cre-bridge**, **cre-swap**. Each runs on a schedule and polls `/api/maima/requests`; the AI report is generated in the app chat.

## Project structure

```
├── app/
│   ├── app/                 # Chat interface (wallet-gated)
│   ├── api/
│   │   ├── maima/           # /api/maima/requests, /api/maima/analyze
│   │   ├── tokens/          # Token quotes (optional)
│   │   └── workflows/       # Workflow triggers (optional)
│   ├── docs/                # Documentation
│   ├── page.tsx             # Home
│   └── layout.tsx
├── components/
│   ├── app/                 # BackgroundCircles, ProcessTrackingPanel, RequireWallet
│   ├── design/              # background-beams, flickering-grid, orbits-background, motion-carousel
│   ├── sections/            # navbar, footer, hero, features, how-it-works, cta, maima-image-section
│   └── ui/                  # Shared UI components
├── lib/
│   ├── maima-requests.ts    # In-memory request store
│   ├── maima-types.ts       # Report types
│   ├── wallet-config.ts
│   └── ...
├── cre/
│   ├── cre-maima/           # Main CRE workflow
│   ├── cre-bridge/          # Bridge CRE workflow
│   └── cre-swap/            # Swap CRE workflow
└── project.yaml             # CRE project config
```

## Getting started

### Prerequisites

- Node.js 18+
- pnpm (or npm)
- Web3 wallet (e.g. MetaMask) for the App

### Installation

1. Clone and install:
   ```bash
   git clone https://github.com/mrselva-eth/MAIMA.git
   cd MAIMA
   pnpm install
   ```

2. Environment:
   ```bash
   cp .env.example .env
   ```
   Set at least **NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID** (from [WalletConnect Cloud](https://cloud.walletconnect.com)) so the App and wallet connect work. Other variables in `.env.example` are optional (OpenAI, OpenRouter, API base URL, Uniswap router, CRE key, ElizaOS).

3. Run the app:
   ```bash
   pnpm dev
   ```
   Open [http://localhost:3000](http://localhost:3000). Use **App** for the chat (connect your wallet when prompted).

## Environment variables

| Variable | Required | Description |
|---------|----------|-------------|
| `NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID` | Yes (for App) | WalletConnect project ID (RainbowKit) |
| `OPENAI_API_KEY` | No | OpenAI API key |
| `OPENROUTER_API_KEY` / `OPENROUTER_MODEL` | No | OpenRouter for model routing |
| `NEXT_PUBLIC_API_BASE_URL` | No | Base URL for API (default `http://localhost:3000`) |
| `NEXT_PUBLIC_UNISWAP_ROUTER_ADDRESS` | No | Uniswap V3 router address |
| `CRE_ETH_PRIVATE_KEY` | No | For CRE workflow simulation |
| `ELIZAOS_API_KEY` | No | ElizaOS integration |

## API

- **GET /api/maima/requests** – Active requests (used by CRE workflows).
- **POST /api/maima/analyze** – Send a prompt, get a report.
  ```json
  { "prompt": "Swap 100 USDC to ETH at best rate" }
  ```
  Response: `accuracy`, `gasFeeEstimate`, `optimisticEstimate`, `topBridges`, `topSwaps`, `summary`.

## Chainlink CRE

- **cre/cre-maima** – Main workflow; polls `/api/maima/requests`.
- **cre/cre-bridge** – Bridge workflow.
- **cre/cre-swap** – Swap workflow.

**Simulate:** Install [CRE CLI](https://docs.chain.link/cre/getting-started/cli-installation). With the app running (`pnpm dev`):

```bash
pnpm cre:simulate           # maima
pnpm cre:simulate:bridge    # bridge
pnpm cre:simulate:swap      # swap
```

## Scripts

| Command | Description |
|---------|--------------|
| `pnpm dev` | Start dev server |
| `pnpm build` | Production build |
| `pnpm start` | Start production server |
| `pnpm lint` | Run ESLint |
| `pnpm cre:simulate` | Simulate main CRE workflow |
| `pnpm cre:simulate:bridge` | Simulate bridge workflow |
| `pnpm cre:simulate:swap` | Simulate swap workflow |

## Next steps

1. Replace top bridges/swaps with your team’s data when ready.
2. Add real swap/bridge execution via your chosen APIs/SDKs.
3. Deploy CRE workflows when you have [Chainlink Early Access](https://cre.chain.link/request-access).

## License

See repository.
