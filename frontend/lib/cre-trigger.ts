/**
 * Trigger CRE workflow simulation from the server when CRE_SIMULATION_MODE=on.
 * Main workflow: cre-maima. Swap: cre-swap. Bridge: cre-bridge.
 * Runs CLI in background (fire-and-forget). Requires CRE CLI installed and on PATH.
 * Paths work when running from repo root (cre/cre-maima) or from frontend/ (../cre/cre-maima).
 */

import { spawn } from 'child_process';
import path from 'path';
import { existsSync } from 'fs';

const TARGET = 'staging-settings';
const CWD = process.cwd();

/** Repo root: when running from frontend/ it's parent of cwd so CRE finds project.yaml. */
function getCreCwd(): string {
  const fromFrontend = path.join(CWD, '..', 'cre', 'cre-maima');
  if (existsSync(fromFrontend)) return path.resolve(CWD, '..');
  return CWD;
}

function getCreWorkflowPath(workflow: 'cre-maima' | 'cre-swap' | 'cre-bridge'): string {
  const fromRoot = path.join(CWD, 'cre', workflow);
  const fromFrontend = path.join(CWD, '..', 'cre', workflow);
  if (existsSync(fromRoot)) return `cre/${workflow}`;
  if (existsSync(fromFrontend)) return `cre/${workflow}`;
  return `cre/${workflow}`;
}

function runCreSimulate(workflowPath: string): void {
  const isWindows = process.platform === 'win32';
  const cmd = isWindows ? 'cre.cmd' : 'cre';
  const cwd = getCreCwd();
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

  const child = spawn(cmd, args, {
    cwd,
    shell: isWindows,
    stdio: 'ignore',
    env: { ...process.env, CI: 'true' },
  });

  child.on('error', (err) => {
    console.warn(`[CRE trigger] ${workflowPath}:`, err.message);
  });
  child.unref();
}

/**
 * Trigger main CRE workflow (cre-maima). Call when a request is registered.
 */
export function triggerCreMaima(): void {
  runCreSimulate(getCreWorkflowPath('cre-maima'));
}

/**
 * Trigger CRE swap workflow (cre-swap). Call when intent is swap.
 */
export function triggerCreSwap(): void {
  runCreSimulate(getCreWorkflowPath('cre-swap'));
}

/**
 * Trigger CRE bridge workflow (cre-bridge). Call when intent is bridge.
 */
export function triggerCreBridge(): void {
  runCreSimulate(getCreWorkflowPath('cre-bridge'));
}

/**
 * Trigger CRE workflows for the given intent type.
 * Always runs cre-maima (main); also runs cre-swap or cre-bridge based on type.
 */
export function triggerCreWorkflows(intentType: 'swap' | 'bridge'): void {
  triggerCreMaima();
  if (intentType === 'swap') {
    triggerCreSwap();
  } else {
    triggerCreBridge();
  }
}
