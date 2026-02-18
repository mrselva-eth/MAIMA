/**
 * Trigger CRE workflow simulation from the server when CRE_SIMULATION_MODE=on.
 * Main workflow: cre-maima. Swap: cre-swap. Bridge: cre-bridge.
 * Runs CLI in background (fire-and-forget). Requires CRE CLI installed and on PATH.
 */

import { spawn } from 'child_process';

const TARGET = 'staging-settings';
const PROJECT_ROOT = process.cwd();

function runCreSimulate(workflowPath: string): void {
  const isWindows = process.platform === 'win32';
  const cmd = isWindows ? 'cre.cmd' : 'cre';
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
    cwd: PROJECT_ROOT,
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
  runCreSimulate('cre/cre-maima');
}

/**
 * Trigger CRE swap workflow (cre-swap). Call when intent is swap.
 */
export function triggerCreSwap(): void {
  runCreSimulate('cre/cre-swap');
}

/**
 * Trigger CRE bridge workflow (cre-bridge). Call when intent is bridge.
 */
export function triggerCreBridge(): void {
  runCreSimulate('cre/cre-bridge');
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
