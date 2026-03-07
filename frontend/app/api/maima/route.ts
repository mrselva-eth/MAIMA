/**
 * Single MAIMA API route. All actions via ?action= (GET) or body.action (POST).
 * GET: queue | report | pending-swap | pending-bridge | status
 * POST: analyze | cre-report | run-swap | run-bridge | quote | step
 */

import { NextRequest, NextResponse } from 'next/server';
import { maimaRequests, maimaReports, pendingSwapQueue, pendingBridgeQueue, type MaimaRequest } from '@/lib/maima';
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
  const p = promptText.toLowerCase();
  const bridgeKeywords = [
    'bridge', 'cross-chain', 'cross chain', 'transfer from', 'send from',
    'to arbitrum', 'to base', 'to polygon', 'to optimism', 'to ethereum', 'to bsc', 'to avalanche',
    'from base', 'from arbitrum', 'from polygon', 'from optimism', 'from ethereum', 'from bsc', 'from avalanche'
  ];
  if (bridgeKeywords.some(kw => p.includes(kw))) return 'bridge';
  return 'swap';
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

function resolveCreCommand(): string {
  const envPathRaw = process.env.CRE_CLI_PATH?.trim();
  if (!envPathRaw) return 'cre';
  return process.platform === 'win32' ? envPathRaw.replace(/\//g, '\\') : envPathRaw;
}

function spawnCreWorkflow(workflow: CreWorkflow): void {
  const cwd = getCreCwd();
  const workflowPath = getWorkflowPath(workflow);
  const cmd = resolveCreCommand();
  const isWindows = process.platform === 'win32';
  const isPathCommand = cmd.includes('\\') || cmd.includes('/') || path.isAbsolute(cmd);

  console.log('[maima] Spawning', workflow, 'cwd=', cwd, 'path=', workflowPath, 'cmd=', cmd);

  const args = ['workflow', 'simulate', workflowPath, '--target', 'staging-settings', '--non-interactive', '--trigger-index', '0'];

  const child = spawn(cmd, args, {
    cwd,
    shell: isWindows && !isPathCommand,
    stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env, CI: 'true' },
  });
  const tag = `[maima ${workflow}]`;
  let lastLine = '';
  const emitUniqueLines = (chunk: Buffer, logFn: (prefix: string, line: string) => void) => {
    const lines = chunk.toString().split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
    for (const line of lines) {
      if (line === lastLine) continue;
      lastLine = line;
      logFn(tag, line);
    }
  };
  child.stdout?.on('data', (d: Buffer) => emitUniqueLines(d, console.log));
  child.stderr?.on('data', (d: Buffer) => emitUniqueLines(d, console.warn));
  child.on('error', (err) => console.warn('[maima] spawn', workflow, err.message));
  child.on('exit', (code) => {
    if (code !== 0) console.warn('[maima]', workflow, 'exited with code', code);
  });
  child.unref();
}

async function parseBody(req: NextRequest): Promise<Record<string, unknown>> {
  const raw = await req.text();
  console.log('[maima API] Raw body received (len):', raw.length);
  try {
    const parsed = JSON.parse(raw);
    console.log('[maima API] Parsed raw JSON action:', parsed.action);
    return parsed as Record<string, unknown>;
  } catch {
    try {
      const decoded = Buffer.from(raw, 'base64').toString('utf8');
      console.log('[maima API] Decoded base64 body (len):', decoded.length);
      const parsed = JSON.parse(decoded);
      console.log('[maima API] Parsed decoded JSON action:', parsed.action);
      return parsed as Record<string, unknown>;
    } catch (e) {
      console.error('[maima API] parseBody failed', e);
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
      case 'status': {
        const txHash = searchParams.get('txHash');
        if (!txHash) return NextResponse.json({ error: 'txHash required' }, { status: 400 });
        const params = new URLSearchParams({ txHash });
        ['fromChain', 'toChain', 'bridge'].forEach((k) => { const v = searchParams.get(k); if (v) params.set(k, v); });
        const res = await fetch(`${LIFI_BASE}/status?${params}`, { method: 'GET', headers: lifiHeaders() });
        const data = await res.json();
        return NextResponse.json(data, { status: res.status });
      }
      case 'diagnostic-status': {
        return NextResponse.json({
          success: true,
          env: {
            LIFI_API_KEY: process.env.LIFI_API_KEY ? 'present' : 'missing',
            CRE_CLI_PATH: process.env.CRE_CLI_PATH,
          },
          stores: {
            requests: Array.from(maimaRequests.entries()),
            reports: Array.from(maimaReports.entries()),
            pendingSwap: pendingSwapQueue.length,
            pendingBridge: pendingBridgeQueue.length,
          }
        });
      }
      default:
        return NextResponse.json({ error: 'Invalid action. Use queue|report|pending-swap|pending-bridge|status' }, { status: 400 });
    }
  } catch (e) {
    console.error('[maima GET]', action, e);
    return NextResponse.json({ error: 'Request failed' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const body = await parseBody(req);
  const action = (body.action as string) || '';
  console.log('[maima API] Action:', action, 'Keys:', Object.keys(body));

  try {
    switch (action) {
      case 'analyze': {
        const prompt = (body.prompt as string) ?? '';
        const fromAddress = (body.fromAddress as string) ?? '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045';
        const requestId = `maima_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
        // Accept AI-parsed type from client; fall back to regex
        const clientType = body.intentType as 'swap' | 'bridge' | undefined;
        const type = (clientType === 'swap' || clientType === 'bridge') ? clientType : inferType(prompt.toLowerCase());
        maimaRequests.set(requestId, { id: requestId, prompt, fromAddress, type, createdAt: new Date().toISOString() });
        if (type === 'swap' || type === 'bridge') spawnCreWorkflow('cre-maima');
        return NextResponse.json({ success: true, requestId });
      }
      case 'cre-report': {
        const requestId = body.requestId as string;
        const report = body.report;
        console.log('[maima] cre-report received', { requestId, hasReport: !!report });
        if (!requestId || report === undefined) {
          console.warn('[maima] cre-report invalid payload', body);
          return NextResponse.json({ error: 'requestId and report required' }, { status: 400 });
        }
        maimaReports.set(requestId, report);
        console.log('[maima] cre-report stored', requestId, 'Total reports:', maimaReports.size);
        return NextResponse.json({ success: true, requestId });
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
        const requestJSON = body.request as Record<string, unknown> | undefined;
        if (!requestJSON?.id) return NextResponse.json({ error: 'request with id required' }, { status: 400 });
        const request = { ...requestJSON, type: 'bridge' } as MaimaRequest;

        pendingBridgeQueue.push(request);
        console.log('[maima] run-bridge pushed', request.id, 'queue length', pendingBridgeQueue.length);
        spawnCreWorkflow('cre-bridge');

        return NextResponse.json({ success: true, message: 'cre-bridge triggered' });
      }
      default:
        return NextResponse.json({ error: 'Invalid action. Use analyze|cre-report|run-swap|run-bridge' }, { status: 400 });
    }
  } catch (e) {
    console.error('[maima POST]', action, e);
    return NextResponse.json({ error: 'Request failed' }, { status: 500 });
  }
}
