# API folder – what each route does

Quick reference for every route under `app/api/`.

---

## cre/simulation

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/cre/simulation` | Run a CRE workflow (maima, swap, or bridge) and return its log output. |

- **When:** Only when `CRE_SIMULATION_MODE=on`. Used by the Process Tracking panel to show CRE output.
- **Body:** `{ "type": "maima" | "swap" | "bridge" }`.
- **Response:** `{ success, output }` – stdout/stderr from the CRE CLI.
- **Used by:** Frontend (ProcessTrackingPanel) in simulation mode.

---

## maima/analyze

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/maima/analyze` | Turn a user message into a MAIMA report (routes, gas, best protocol, workflow steps). |

- **Body:** `{ prompt, fromAddress? }`. Optional: full route params (fromChainId, toChainId, fromTokenAddress, toTokenAddress, fromAmount, fromAddress).
- **Flow:** Infers swap vs bridge from prompt → calls **maima/routing?action=quote** (LI.FI) → ranks routes → picks best → returns report. If simulation mode is on, also stores the request and triggers CRE workflows.
- **Response:** `{ report }` (AnalyzeReport) or `{ error }`.
- **Used by:** App page (chat “Send” → analyze request).

---

## maima/queue

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/maima/queue` | Return the list of active MAIMA requests (for CRE to poll). |

- **Response:** `{ success, requests[], count }`. Data comes from in-memory store (`lib/maima-requests`).
- **Used by:** CRE workflows (cre-maima, cre-swap, cre-bridge) when they run; not called by the frontend.

---

## maima/routing

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/maima/routing?action=quote` | Proxy to LI.FI “advanced routes” to get route options. |
| POST | `/api/maima/routing?action=step` | Proxy to LI.FI “stepTransaction” to get the transaction for one step. |
| GET | `/api/maima/routing?action=status` | Proxy to LI.FI “status” to get tx status and final received amount. |

- **quote:** Body = LI.FI route payload. Used by **maima/analyze**.
- **step:** Body = LI.FI step payload. Used by Process Tracking (real execution).
- **status:** Query = `txHash` (required), optional `fromChain`, `toChain`, `bridge`. Used by Process Tracking after tx submit.

---

## Summary

| Folder / file | Route | Used by |
|---------------|--------|---------|
| `cre/simulation/route.ts` | POST /api/cre/simulation | Process Tracking (simulation) |
| `maima/analyze/route.ts` | POST /api/maima/analyze | App page (chat) |
| `maima/queue/route.ts` | GET /api/maima/queue | CRE workflows |
| `maima/routing/route.ts` | POST/GET /api/maima/routing?action=quote\|step\|status | maima/analyze, Process Tracking |
