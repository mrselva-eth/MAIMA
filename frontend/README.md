# MAIMA — DeFi Optimistic Solution Handler

MAIMA analyzes your swap and bridge needs and returns a **report** (accuracy, gas fee, optimistic estimates). Describe what you want in natural language, see **process tracking** (protocols checked, choose one), and get the best option. Deploy workflows to Chainlink when you have Early Access.

**Repository:** [https://github.com/mrselva-eth/MAIMA](https://github.com/mrselva-eth/MAIMA)  
**Default branch:** `main`

## Key features

- **Chat interface (App)** – Describe swap or bridge in natural language (e.g. “Swap 100 USDC to ETH”, “Bridge 500 USDT from Ethereum to Arbitrum”). **Wallet connect required** to access the app.
- **Report** – Accuracy, gas fee estimate, optimistic execution, and top bridges/swaps.
- **Process tracking** – In the app, track protocols as they’re checked, then choose one and see the result.
- **CRE workflows** – Under `cre/`: **cre-maima** (main), **cre-bridge**, **cre-swap**. Each runs on a schedule and polls `/api/maima/queue`; the AI report is generated in the app chat.

## Project structure

```
├── app/
│   ├── app/                 # Chat (wallet-gated), layout + page
│   ├── api/
│   │   ├── cre/             # /api/cre/simulation
│   │   └── maima/           # /api/maima/analyze, /api/maima/queue, /api/maima/routing
│   ├── docs/                # Docs, layout + page
│   ├── page.tsx             # Home
│   └── layout.tsx
├── context/                 # RequireWallet (reusable wallet gate)
├── components/
│   ├── app/tracking-wind/   # ProcessTrackingPanel, tracking-types, tracking-helpers, use-tracking-flow
│   ├── design/              # BackgroundCircles, TrackingChartHeader, background-beams, flickering-grid, etc.
│   ├── sections/            # navbar, footer, hero, features, cta, maima-image-section
│   └── ui/                  # Shared UI
├── lib/                     # maima-requests, maima-types, utils, wallet-config, cre-trigger
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
   Set **NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID** (from [WalletConnect Cloud](https://cloud.walletconnect.com)) for the app. Optional: `LIFI_API_KEY`, `CRE_SIMULATION_MODE` / `NEXT_PUBLIC_CRE_SIMULATION_MODE`, `CRE_CLI_PATH`.

3. Run the app:
   ```bash
   pnpm dev
   ```
   Open [http://localhost:3000](http://localhost:3000). Use **App** for the chat (connect your wallet when prompted).

## Environment variables

| Variable | Required | Description |
|---------|----------|-------------|
| `NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID` | Yes (for App) | WalletConnect project ID (RainbowKit) |
| `LIFI_API_KEY` | No | LI.FI API key (better rate limits for routing) |
| `CRE_SIMULATION_MODE` | No | `on` \| `off` (default). Server-side CRE simulation. |
| `NEXT_PUBLIC_CRE_SIMULATION_MODE` | No | `on` \| `off`. Client-side; when `on`, chat shows “MAIMA is miming” until tracking shows top protocols. |
| `CRE_CLI_PATH` | No | Path to CRE CLI when not on PATH (simulation only). |

## API

- **GET /api/maima/queue** – Active requests (used by CRE workflows).
- **POST /api/maima/analyze** – Send a prompt, get a report.
  ```json
  { "prompt": "Swap 100 USDC to ETH at best rate" }
  ```
  Response: `accuracy`, `gasFeeEstimate`, `optimisticEstimate`, `topBridges`, `topSwaps`, `summary`.

## Simulation mode & CRE workflow simulation

- **Default (live):** `CRE_SIMULATION_MODE=off` or unset. The app uses **real LI.FI only** (no CRE). When the user chooses a protocol, real execution runs (MetaMask, LI.FI step-transaction). Production behavior.
- **CRE simulation (hackathon / Chainlink demo):** Set `CRE_SIMULATION_MODE=on` in `.env`. Then:
  - **Report** still uses **LI.FI** (same accuracy, gas, ranking).
  - Each request is **registered** for CRE and the backend **triggers CRE workflows**: **cre-maima** (main) every time; **cre-swap** for swap requests; **cre-bridge** for bridge requests.
  - **No real execution:** Choosing a protocol does **not** open MetaMask or send a real transaction. The UI shows a simulated result and “CRE simulation mode: real execution disabled.”
  - Set **`NEXT_PUBLIC_CRE_SIMULATION_MODE=on`** so the chat shows a big centered loading (logo + "MAIMA is miming") until the tracking panel shows the top protocol list; then the report appears in the chat.
  - Use this to **share the CRE simulation process** with Chainlink without executing real txs. CRE CLI must be installed and on the server PATH. If the **track window** shows “cre.cmd is not recognized”, ensure CRE CLI is on the server PATH so the track window can run simulations.

Real deployment to a Chainlink DON requires Early Access; until then, only simulation is used for CRE.

## Chainlink CRE

- **cre/cre-maima** – Main workflow; polls `/api/maima/queue`.
- **cre/cre-bridge** – Bridge workflow.
- **cre/cre-swap** – Swap workflow.

**Simulate:** Install [CRE CLI](https://docs.chain.link/cre/getting-started/cli-installation). With the app running (`pnpm dev`), and with `CRE_SIMULATION_MODE=on` if you want the workflows to see app requests:

```bash
pnpm cre:simulate           # maima
pnpm cre:simulate:bridge    # bridge
pnpm cre:simulate:swap      # swap
```

### CRE simulate on Windows (troubleshooting)

TypeScript workflows need **Bun** for the JS→WASM compile step. If you see `Script not found "cre-compile-workflow"` or `The system cannot find the file specified`:

1. **Install Bun** (v1.2.21+): https://bun.sh/docs/installation (e.g. `powershell -c "irm bun.sh/install.ps1 | iex"`).
2. **Install workflow deps with Bun** so the CRE SDK’s WebAssembly setup runs:
   ```bash
   cd cre/cre-maima
   bun install
   cd ../cre-swap && bun install
   cd ../cre-bridge && bun install
   cd ../..
   ```
3. From the **project root** run:
   ```bash
   cre workflow simulate cre/cre-maima --target staging-settings
   ```
4. If it still fails (e.g. path or Bun issues on Windows), try running the same commands from **WSL** (Ubuntu) and use the repo from the WSL filesystem.

**Updating CRE on Windows:** `cre update` downloads the new binary but cannot replace it automatically. Close any running `cre` processes, then copy the downloaded exe (e.g. from `%TEMP%\cre_update_*\cre_v*_windows_amd64.exe`) over `%LOCALAPPDATA%\Programs\cre\cre.exe`, or run the new exe from the temp folder.

### Process tracking in production (logs not complete)

If the Process Tracking panel shows the full log locally but not in production after you select a protocol:

1. **Deploy the latest code**  
   Ensure the commit that shows execution logs when reverting to “choose” (e.g. “Wallet not connected” or “Route has no steps”) is deployed. Redeploy and, if your host caches builds, trigger a fresh build or clear cache.

2. **Environment**  
   In production, set `CRE_SIMULATION_MODE` and `NEXT_PUBLIC_CRE_SIMULATION_MODE` as needed. If both are off, you need a connected wallet and routes with steps to see full execution logs; otherwise you’ll see the revert messages (and with the fix, those still appear in the execution block).

3. **Browser**  
   Open DevTools → Network and Console, then select a protocol. Check for failed requests to `/api/maima/analyze` or `/api/maima/routing`, and any console errors.

4. **API shape**  
   Confirm `/api/maima/analyze` and `/api/maima/routing?action=quote` return the same shape as locally (e.g. `report.routes` with `steps`). If the backend uses `req.url` for the internal fetch to routing, ensure the request’s host is the public app URL (no wrong host in serverless).

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
