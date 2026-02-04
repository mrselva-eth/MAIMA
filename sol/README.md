# MAIMA Contracts (sol/)

Solidity contracts for the MAIMA intent-based smart wallet: **IntentRegistry**, **IntentWallet**, **SafetyModule**, and **MockSafe**. Built with Hardhat; deploy and verify on Base Sepolia.

## Setup

1. Copy the env template and add your keys:
   ```bash
   cp .env.example .env
   ```
2. Edit `.env`:
   - **`ETH_PRIVATE_KEY`** — Deployer wallet private key (Base Sepolia).
   - **`ETHERSCAN_API_KEY`** — For verification ([etherscan.io/myapikey](https://etherscan.io/myapikey)).
3. Install and compile:
   ```bash
   pnpm install
   pnpm run compile
   ```

## Scripts

| Command | Description |
|--------|-------------|
| `pnpm run compile` | Compile contracts |
| `pnpm run deploy:base-sepolia` | Deploy to Base Sepolia (writes `contracts-deployed-base-sepolia.json`) |
| `pnpm run verify:base-sepolia` | Verify deployed contracts on Basescan (run after deploy) |

## Network

- **Base Sepolia** — chainId `84532`, RPC `https://sepolia.base.org`  
- Explorer: [sepolia.basescan.org](https://sepolia.basescan.org)

## Deployed Contracts (Base Sepolia)

Addresses below are from the latest deployment and are verified on Basescan.

| Contract | Address | Explorer |
|----------|---------|----------|
| **IntentRegistry** | `0xF45638EeF0dD27528fdAb5B04716177208A82B20` | [View](https://sepolia.basescan.org/address/0xF45638EeF0dD27528fdAb5B04716177208A82B20#code) |
| **MockSafe** | `0xf47595A3CeE023Ea5442D879E450987D51FAA611` | [View](https://sepolia.basescan.org/address/0xf47595A3CeE023Ea5442D879E450987D51FAA611#code) |
| **IntentWallet** | `0x1020A42Fe06a207F26D97727bdd7B4Bb63318B6B` | [View](https://sepolia.basescan.org/address/0x1020A42Fe06a207F26D97727bdd7B4Bb63318B6B#code) |
| **SafetyModule** | `0xb3Fa77eef30136EbC83282Df652619Ca20f2Cd78` | [View](https://sepolia.basescan.org/address/0xb3Fa77eef30136EbC83282Df652619Ca20f2Cd78#code) |

### JSON (for app / CRE config)

```json
{
  "network": "base-sepolia",
  "chainId": 84532,
  "IntentRegistry": "0xF45638EeF0dD27528fdAb5B04716177208A82B20",
  "MockSafe": "0xf47595A3CeE023Ea5442D879E450987D51FAA611",
  "IntentWallet": "0x1020A42Fe06a207F26D97727bdd7B4Bb63318B6B",
  "SafetyModule": "0xb3Fa77eef30136EbC83282Df652619Ca20f2Cd78"
}
```

After running `pnpm run deploy:base-sepolia`, the same data is written to `contracts-deployed-base-sepolia.json` in this folder (file is gitignored).

## Contract roles

- **IntentRegistry** — Stores intent metadata and lifecycle; sets CRE executor.
- **MockSafe** — Minimal Safe-like contract for testing (owner, exec).
- **IntentWallet** — Executes intents (authorized CRE caller, rate limiting).
- **SafetyModule** — Emergency controls, circuit breaker, whitelisting, time locks.

## What is not committed

- `.env` — secrets  
- `contracts-deployed-base-sepolia.json` — deployment output  
- `node_modules/`, `cache/`, `artifacts/`

Use `.env.example` as a template; copy to `.env` and fill in your values.
