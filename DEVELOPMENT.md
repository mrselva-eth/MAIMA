# MAIMA Development Guide

This guide describes how to set up, develop, and test the MAIMA project.

## Project Setup

### 1. Installation
The project is a monorepo managed with `pnpm`.

```bash
pnpm install
# Install frontend dependencies
cd frontend && pnpm install
# Install CRE module dependencies
cd ../cre/cre-maima && pnpm install
cd ../cre-swap && pnpm install
cd ../cre-bridge && pnpm install
```

### 2. Environment Variables
Create a `.env` file in the `frontend/` directory:

```env
# Required for Wallet Interaction
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=...

# Required for AI intent parsing (OpenRouter or OpenAI)
AI_API_KEY=...

# Optional: For better rate limits
LIFI_API_KEY=...

# Path to the CRE CLI (on Windows, usually bin/cre.exe)
CRE_CLI_PATH=bin/cre.exe
```

## Developing CRE Workflows

CRE workflows are written in TypeScript and compiled to WASM.

### Structure of a Workflow
Each folder in `cre/` (e.g., `cre-swap`) contains:
- `main.ts`: The entry point and logic.
- `workflow.yaml`: Defines triggers and permissions.
- `config.staging.json`: Local/Staging settings (e.g., `apiBaseUrl`).

### Compilation
To compile a workflow into WASM:

```bash
cd cre/cre-swap
pnpm run build
```

The output (`main.wasm`) is what the `cre` CLI executes during simulation or production runs.

## Testing & Simulation

### Automated Simulation
The frontend API can automatically spawn CRE workflow simulations when a user submits an analysis request. 

### Manual Simulation
You can run a workflow manually using the `cre` CLI from the repository root:

```bash
cre workflow simulate cre/cre-swap --target staging-settings --non-interactive --trigger-index 0
```

### Diagnostic API
Use the diagnostic endpoint to check the internal state of the API (pending requests, reports):

```bash
GET http://localhost:3000/api/maima?action=diagnostic-status
```

## UI Component Guidelines

### Process Tracking
When adding new analysis steps to a CRE workflow, ensure you update the `workflow` array in the generated report. The frontend `ProcessTrackingPanel` dynamically renders these steps.

### Custom Hooks
- `use-tracking-flow.ts`: Handles the polling and state management for the analysis process.
- `use-maima.ts`: Handles the chat interaction and intent submission.

## Contribution Workflow

1. **Branching**: Use descriptive branch names (e.g., `feat/new-worker`).
2. **Linting**: Run `pnpm lint` in the frontend directory before committing.
3. **Documentation**: If you add a new API action or CRE workflow, update this guide and `ARCHITECTURE.md`.
