/**
 * Environment check.
 *
 * Run with `pnpm check:env`. Reports which chains can reach live data and which
 * will fall back to the mock transport, so a contributor never has to guess why
 * a value did not update.
 *
 * No secrets are printed — only whether a variable is present.
 */

import { supportedChains, ENV_KEYS } from '@blocksense/blockchain';
import { config } from '../apps/api/src/config/index';

const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const DIM = '\x1b[2m';
const BOLD = '\x1b[1m';
const RESET = '\x1b[0m';

function present(name: string): boolean {
  const value = process.env[name];
  return Boolean(value && value.trim());
}

function line(label: string, value: string): void {
  process.stdout.write(`  ${label.padEnd(26)} ${value}\n`);
}

process.stdout.write(`\n${BOLD}BlockSense environment${RESET}\n\n`);

process.stdout.write(`${BOLD}Runtime${RESET}\n`);
line('Node', process.version);
line('Environment', config.env);
line('Mock latency', `${config.mockLatency}ms`);
line('Use live data', config.useLiveData ? `${GREEN}yes${RESET}` : `${YELLOW}no (mock)${RESET}`);
process.stdout.write('\n');

process.stdout.write(`${BOLD}Chain credentials${RESET}\n${DIM}  Adapters fall back to mock data when a URL is missing.${RESET}\n\n`);

let live = 0;
for (const chain of supportedChains()) {
  const keys = ENV_KEYS[chain];
  const hasRpc = present(keys.rpcUrl);
  const hasKey = keys.apiKey ? present(keys.apiKey) : true;

  if (hasRpc && config.useLiveData) {
    live += 1;
  }

  const rpcLabel = hasRpc ? `${GREEN}set${RESET}` : `${YELLOW}missing${RESET}`;
  const keyLabel = keys.apiKey ? ` / ${keys.apiKey}: ${hasKey ? `${GREEN}set${RESET}` : `${YELLOW}missing${RESET}`}` : '';
  process.stdout.write(`  ${chain.padEnd(10)} ${rpcLabel}${keyLabel}\n`);
}

process.stdout.write('\n');

if (!config.useLiveData) {
  process.stdout.write(
    `${YELLOW}USE_LIVE_DATA is false.${RESET} Every chain is serving mock data.\n` +
      'Set USE_LIVE_DATA=true in your environment once you have added at least one RPC URL.\n\n'
  );
} else if (live === 0) {
  process.stdout.write(
    `${YELLOW}USE_LIVE_DATA is true but no RPC URL is set.${RESET} Every chain is serving mock data.\n\n`
  );
} else {
  process.stdout.write(`${GREEN}${live} of ${supportedChains().length} chains are live.${RESET}\n\n`);
}
