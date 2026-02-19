/**
 * Single CRE API route. POST only: body.action = simulation (runs CRE workflow, returns output).
 */

import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';
import { existsSync } from 'fs';

const TARGET = 'staging-settings';
const ROOT = process.cwd();

function getWorkflowPath(workflow: 'cre-maima' | 'cre-swap' | 'cre-bridge'): string {
  if (existsSync(path.join(ROOT, 'cre', workflow))) return `cre/${workflow}`;
  if (existsSync(path.join(ROOT, '..', 'cre', workflow))) return `../cre/${workflow}`;
  return `cre/${workflow}`;
}

const WORKFLOW_MAP: Record<string, 'cre-maima' | 'cre-swap' | 'cre-bridge'> = {
  maima: 'cre-maima',
  swap: 'cre-swap',
  bridge: 'cre-bridge',
};

export async function POST(req: NextRequest) {
  if (process.env.CRE_SIMULATION_MODE !== 'on') {
    return NextResponse.json({ success: false, error: 'CRE simulation mode is not enabled' }, { status: 400 });
  }
  let body: { action?: string; type?: string } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON' }, { status: 400 });
  }
  const type = (body.type ?? body.action ?? 'maima') as string;
  const workflow = WORKFLOW_MAP[type];
  if (!workflow) {
    return NextResponse.json({ success: false, error: `Invalid type. Use maima, swap, or bridge` }, { status: 400 });
  }
  const workflowPath = getWorkflowPath(workflow);
  const isWindows = process.platform === 'win32';
  const cmd = process.env.CRE_CLI_PATH?.trim().replace(/^["']|["']$/g, '') || (isWindows ? 'cre.cmd' : 'cre');
  const args = ['workflow', 'simulate', workflowPath, '--target', TARGET, '--non-interactive', '--trigger-index', '0'];

  return new Promise<NextResponse>((resolve) => {
    const child = spawn(cmd, args, { cwd: ROOT, shell: isWindows, env: { ...process.env, CI: 'true' } });
    let stdout = '';
    let stderr = '';
    child.stdout?.on('data', (chunk: Buffer) => { stdout += chunk.toString(); });
    child.stderr?.on('data', (chunk: Buffer) => { stderr += chunk.toString(); });
    child.on('close', (code) => {
      const output = [stdout, stderr].filter(Boolean).join('\n').trim() || '(no output)';
      resolve(NextResponse.json({ success: code === 0, output, exitCode: code ?? undefined }));
    });
    child.on('error', (err) => resolve(NextResponse.json({ success: false, output: '', error: err.message })));
  });
}
