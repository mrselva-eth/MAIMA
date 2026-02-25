/**
 * Single MAIMA API route. All actions via ?action= (GET) or body.action (POST).
 * GET: queue | report | pending-swap | pending-bridge | chainlink-price | status
 * POST: analyze | cre-report | run-swap | run-bridge | quote | step
 */

import { NextRequest, NextResponse } from 'next/server';
import { maimaRequests, maimaReports, pendingSwapQueue, pendingBridgeQueue, congestionStore, type MaimaRequest } from '@/lib/maima';
import { getChainlinkPrice } from '@/lib/chainlink-oracle';
import path from 'path';
import { existsSync } from 'fs';
import { spawn } from 'child_process';

const LIFI_BASE = 'https://li.quest/v1';

function lifiHeaders(): Record<string, string> {
  const h: Record<string, string> = { 'content-type': 'application/json' };
  if (process.env.LIFI_API_KEY) h['x-lifi-api-key'] = process.env.LIFI_API_KEY;
  return h;
}

function inferType(promptText: string): 'swap' | 'bridge' {
  return /bridge|cross[-\s]?chain|base\s*to\s*arbitrum|arbitrum\s*to\s*base/.test(promptText) ? 'bridge' : 'swap';
}

function getCreCwd(): string {
  const cwd = process.cwd();
  const fromFrontend = path.join(cwd, '..', 'cre', 'cre-swap');
  if (existsSync(fromFrontend)) return path.resolve(cwd, '..');
  return cwd;
}

type CreWorkflow = 'cre-maima' | 'cre-swap' | 'cre-bridge';

function getWorkflowPath(workflow: CreWorkflow): string {
  const root = process.cwd();
  if (existsSync(path.join(root, 'cre', workflow))) return 'cre/' + workflow;
  if (existsSync(path.join(root, '..', 'cre', workflow))) return 'cre/' + workflow;
  return 'cre/' + workflow;
}

function spawnCreWorkflow(workflow: CreWorkflow): void {
  const isWindows = process.platform === 'win32';
  const cwd = getCreCwd();
  const workflowPath = getWorkflowPath(workflow);
  console.log('[maima] Spawning', workflow, 'cwd=', cwd, 'path=', workflowPath);
  const cmd = process.env.CRE_CLI_PATH || 'npx';
  const args = process.env.CRE_CLI_PATH
    ? ['workflow', 'simulate', workflowPath, '--target', 'staging-settings', '--non-interactive', '--trigger-index', '0']
    : ['cre', 'workflow', 'simulate', workflowPath, '--target', 'staging-settings', '--non-interactive', '--trigger-index', '0'];
  const child = spawn(cmd, args, {
    cwd,
    shell: isWindows,
    stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env, CI: 'true' },
  });
  const tag = `[maima ${workflow}]`;
  child.stdout?.on('data', (d) => console.log(tag, d.toString().trim()));
  child.stderr?.on('data', (d) => console.warn(tag, d.toString().trim()));
  child.on('error', (err) => console.warn('[maima] spawn', workflow, err.message));
  child.on('exit', (code) => {
    if (code !== 0) console.warn('[maima]', workflow, 'exited with code', code);
  });
  child.unref();
}

async function parseBody(req: NextRequest): Promise<Record<string, unknown>> {
  const raw = await req.text();
  try {
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    try {
      return JSON.parse(Buffer.from(raw, 'base64').toString('utf8')) as Record<string, unknown>;
    } catch {
      return {};
    }
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const action = searchParams.get('action') || '';

  try {
    switch (action) {
      case 'queue': {
        const requests = Array.from(maimaRequests.values());
        return NextResponse.json({ success: true, requests, count: requests.length });
      }
      case 'report': {
        const requestId = searchParams.get('requestId');
        if (!requestId) return NextResponse.json({ error: 'requestId required' }, { status: 400 });
        const report = maimaReports.get(requestId);
        return NextResponse.json({ success: report !== undefined, report: report ?? null });
      }
      case 'pending-swap': {
        const request = pendingSwapQueue.shift() ?? null;
        if (request) console.log('[maima] pending-swap consumed', (request as MaimaRequest).id);
        return NextResponse.json({ success: true, request });
      }
      case 'pending-bridge': {
        const request = pendingBridgeQueue.shift() ?? null;
        if (request) console.log('[maima] pending-bridge consumed', (request as MaimaRequest).id);
        return NextResponse.json({ success: true, request });
      }
      case 'chainlink-price': {
        const symbol = searchParams.get('symbol');
        const chainId = Number(searchParams.get('chainId')) || 8453;
        if (!symbol) return NextResponse.json({ error: 'symbol required' }, { status: 400 });
        const result = await getChainlinkPrice(symbol, Number.isFinite(chainId) ? chainId : 8453);
        if (!result) return NextResponse.json({ error: 'No price feed' }, { status: 404 });
        return NextResponse.json({ symbol: result.pair?.split('/')[0], price: result.price, updatedAt: result.updatedAt, chainId: result.chainId });
      }
      case 'status': {
        const txHash = searchParams.get('txHash');
        if (!txHash) return NextResponse.json({ error: 'txHash required' }, { status: 400 });
        const params = new URLSearchParams({ txHash });
        ['fromChain', 'toChain', 'bridge'].forEach((k) => { const v = searchParams.get(k); if (v) params.set(k, v); });
        const res = await fetch(`${LIFI_BASE}/status?${params}`, { method: 'GET', headers: lifiHeaders() });
        const data = await res.json();
        return NextResponse.json(data, { status: res.status });
      }
      case 'congestion': {
        const chainId = searchParams.get('chainId') || '8453';
        const data = congestionStore.get(chainId) ?? null;
        return NextResponse.json({ success: true, data });
      }
      default:
        return NextResponse.json({ error: 'Invalid action. Use queue|report|pending-swap|pending-bridge|chainlink-price|status' }, { status: 400 });
    }
  } catch (e) {
    console.error('[maima GET]', action, e);
    return NextResponse.json({ error: 'Request failed' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const body = await parseBody(req);
  const action = (body.action as string) || '';

  try {
    switch (action) {
      case 'analyze': {
        const prompt = (body.prompt as string) ?? '';
        const fromAddress = (body.fromAddress as string) ?? '0x0000000000000000000000000000000000000000';
        const requestId = `maima_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
        const type = inferType(prompt.toLowerCase());
        maimaRequests.set(requestId, { id: requestId, prompt, fromAddress, type, createdAt: new Date().toISOString() });
        if (process.env.CRE_SIMULATION_MODE === 'on') spawnCreWorkflow('cre-maima');
        return NextResponse.json({ success: true, requestId });
      }
      case 'cre-report': {
        const requestId = body.requestId as string;
        const report = body.report;
        if (!requestId || report === undefined) return NextResponse.json({ error: 'requestId and report required' }, { status: 400 });
        maimaReports.set(requestId, report);
        maimaRequests.delete(requestId);
        return NextResponse.json({ success: true, requestId });
      }
      case 'congestion-report': {
        const data = body.data as any;
        if (!data?.chainId) return NextResponse.json({ error: 'data with chainId required' }, { status: 400 });
        congestionStore.set(String(data.chainId), data);
        console.log('[maima] congestion-report received', data.chainId, data.status);
        return NextResponse.json({ success: true });
      }
      case 'run-swap': {
        const request = body.request as Record<string, unknown> | undefined;
        if (!request?.id) return NextResponse.json({ error: 'request with id required' }, { status: 400 });
        pendingSwapQueue.push({ ...request, type: 'swap' } as MaimaRequest);
        console.log('[maima] run-swap pushed', request.id, 'queue length', pendingSwapQueue.length);
        spawnCreWorkflow('cre-swap');
        return NextResponse.json({ success: true, message: 'cre-swap triggered' });
      }
      case 'run-bridge': {
        const request = body.request as Record<string, unknown> | undefined;
        if (!request?.id) return NextResponse.json({ error: 'request with id required' }, { status: 400 });
        pendingBridgeQueue.push({ ...request, type: 'bridge' } as MaimaRequest);
        console.log('[maima] run-bridge pushed', request.id, 'queue length', pendingBridgeQueue.length);
        spawnCreWorkflow('cre-bridge');
        return NextResponse.json({ success: true, message: 'cre-bridge triggered' });
      }
      case 'quote': {
        const payload = body.payload ?? body;
        const res = await fetch(`${LIFI_BASE}/advanced/routes`, { method: 'POST', headers: lifiHeaders(), body: JSON.stringify(payload) });
        const data = await res.json();
        return NextResponse.json(data, { status: res.status });
      }
      case 'step': {
        const payload = (body.step ?? body) as Record<string, unknown>;
        const res = await fetch(`${LIFI_BASE}/advanced/stepTransaction`, { method: 'POST', headers: lifiHeaders(), body: JSON.stringify(payload) });
        const data = await res.json();
        return NextResponse.json(data, { status: res.status });
      }
      default:
        return NextResponse.json({ error: 'Invalid action. Use analyze|cre-report|run-swap|run-bridge|quote|step' }, { status: 400 });
    }
  } catch (e) {
    console.error('[maima POST]', action, e);
    return NextResponse.json({ error: 'Request failed' }, { status: 500 });
  }
}
