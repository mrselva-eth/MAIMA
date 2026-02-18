/**
 * POST /api/cre/simulation
 * Runs CRE workflow simulate for the given type and returns captured stdout/stderr.
 * Used when CRE_SIMULATION_MODE=on to show CRE output in the tracking panel.
 */

import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';

const TARGET = 'staging-settings';
const PROJECT_ROOT = process.cwd();

const WORKFLOW_MAP = {
  maima: 'cre/cre-maima',
  swap: 'cre/cre-swap',
  bridge: 'cre/cre-bridge',
} as const;

export type CreRunType = keyof typeof WORKFLOW_MAP;

export async function POST(req: NextRequest) {
  if (process.env.CRE_SIMULATION_MODE !== 'on') {
    return NextResponse.json(
      { success: false, error: 'CRE simulation mode is not enabled' },
      { status: 400 }
    );
  }

  let body: { type?: string } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { success: false, error: 'Invalid JSON body' },
      { status: 400 }
    );
  }

  const type = (body.type ?? 'maima') as CreRunType;
  const workflowPath = WORKFLOW_MAP[type];
  if (!workflowPath) {
    return NextResponse.json(
      { success: false, error: `Invalid type: ${type}. Use maima, swap, or bridge` },
      { status: 400 }
    );
  }

  const isWindows = process.platform === 'win32';
  const crePath = process.env.CRE_CLI_PATH?.trim().replace(/^["']|["']$/g, '');
  const cmd = crePath || (isWindows ? 'cre' : 'cre');
  const args = [
    'workflow',
    'simulate',
    workflowPath,
    '--target',
    TARGET,
    '--non-interactive',
    '--trigger-index',
    '0',
  ];

  return new Promise<NextResponse>((resolve) => {
    const child = spawn(cmd, args, {
      cwd: PROJECT_ROOT,
      shell: isWindows,
      env: { ...process.env, CI: 'true' },
    });

    let stdout = '';
    let stderr = '';

    child.stdout?.on('data', (chunk: Buffer) => {
      stdout += chunk.toString();
    });
    child.stderr?.on('data', (chunk: Buffer) => {
      stderr += chunk.toString();
    });

    child.on('close', (code) => {
      const output = [stdout, stderr].filter(Boolean).join('\n').trim() || '(no output)';
      resolve(
        NextResponse.json({
          success: code === 0,
          output,
          exitCode: code ?? undefined,
        })
      );
    });

    child.on('error', (err) => {
      resolve(
        NextResponse.json({
          success: false,
          output: '',
          error: err.message,
        })
      );
    });
  });
}
