# MAIMA Frontend

Next.js app for the MAIMA DeFi solution — chat interface, process tracking, and protocol selection.

---

## Overview

- **Home** — Hero, features, how it works
- **App** — Wallet-gated chat; natural-language swap/bridge requests
- **Process tracking** — Input checked, protocols listed, top 4 choose one, execute

---

## Project structure

```
frontend/
├── app/
│   ├── app/                    # Chat (wallet-gated)
│   │   └── page.tsx
│   ├── api/
│   │   ├── maima/route.ts      # Queue, report, quote, step, chainlink-price
│   │   └── cre/route.ts        # CRE simulation (POST type=maima|swap|bridge)
│   ├── docs/
│   ├── page.tsx                # Home
│   └── layout.tsx
├── components/
│   ├── app/tracking-wind/      # ProcessTrackingPanel, use-tracking-flow, etc.
│   ├── design/                 # BackgroundCircles, background-beams, etc.
│   ├── sections/               # navbar, footer, hero, features, how-it-works
│   └── ui/                     # Shared UI
├── lib/
│   ├── maima.ts                # Types + in-memory stores
│   ├── chainlink-oracle.ts     # Chainlink Price Feed reads
├── hooks/
├── context/                    # RequireWallet
└── .env.example
```

---

## Getting started

### Prerequisites

- Node.js 18+
- pnpm
- Web3 wallet (e.g. MetaMask) for the App

### Installation

```bash
cd frontend
pnpm install
```

### Environment

Copy `.env.example` to `.env`:

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID` | Yes (App) | WalletConnect project ID ([WalletConnect Cloud](https://cloud.walletconnect.com)) |
| `LIFI_API_KEY` | No | LI.FI API key (better rate limits) |
| `CRE_SIMULATION_MODE` | No | `on` \| `off` — spawns CRE workflows on analyze |
| `NEXT_PUBLIC_CRE_SIMULATION_MODE` | No | `on` \| `off` — UI shows simulation mode |
| `CRE_CLI_PATH` | No | Project-local path to CRE CLI (default: `bin/cre.exe`; no global PATH needed) |

### Run

```bash
pnpm dev
```

Open http://localhost:3000. Use **App** for chat (connect wallet when prompted).

---

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start dev server |
| `pnpm build` | Production build |
| `pnpm start` | Start production server |
| `pnpm lint` | Run ESLint |

---

## API (Next.js routes)

**`/api/maima`** — Single route, actions via query or body:

- **GET** `?action=queue` — Pending requests
- **GET** `?action=report&requestId=` — Report by requestId
- **GET** `?action=pending-swap` \| `pending-bridge` — Consume one from queue
- **GET** `?action=chainlink-price&symbol=&chainId=` — Token price from Chainlink
- **POST** `action=analyze` — Enqueue request, spawn cre-maima
- **POST** `action=quote` — Proxy to LI.FI `advanced/routes`
- **POST** `action=step` — Proxy to LI.FI `advanced/stepTransaction`
- **POST** `action=cre-report` — Store report from CRE workflow

**`/api/cre`** — POST `{ type: "maima" | "swap" | "bridge" }` — Run CRE simulation (when `CRE_SIMULATION_MODE=on`).

---

## Tech stack

- Next.js, React
- RainbowKit, wagmi, viem
- Tailwind CSS
- Radix UI
