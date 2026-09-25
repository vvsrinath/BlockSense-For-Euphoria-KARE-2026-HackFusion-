/**
 * Environment check.
 *
 * Run with `pnpm check:env`. Reports which chains will reach a real provider and
 * which are relying on a public endpoint, so a contributor never has to guess why
 * a value did not update.
 *
 * Every chain reads live data. There is no mock transport to fall back to, so
 * this is a report rather than a gate: a missing key is a missing rate limit,
 * not a missing feature.
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
line('Data source', `${GREEN}live${RESET}`);
line('Request timeout', `${config.requestTimeoutMs}ms`);
line('Cache TTL', `${config.cacheTtlSeconds}s`);
process.stdout.write('\n');

process.stdout.write(
  `${BOLD}Chain providers${RESET}\n${DIM}  A public endpoint works without a key; a key raises the rate limit.${RESET}\n\n`
);

let keyed = 0;
let defaulted = 0;

for (const chain of supportedChains()) {
  const keys = ENV_KEYS[chain];
  const hasRpc = present(keys.rpcUrl);
  const hasKey = keys.apiKey ? present(keys.apiKey) : true;

  if (hasRpc) keyed += 1;
  else defaulted += 1;

  const source = hasRpc ? `${GREEN}configured${RESET}` : `${YELLOW}public default${RESET}`;
  const keyLabel = keys.apiKey ? `   ${keys.apiKey}: ${hasKey ? `${GREEN}set${RESET}` : `${YELLOW}missing${RESET}`}` : '';
  process.stdout.write(`  ${chain.padEnd(10)} ${source}${keyLabel}\n`);
}

process.stdout.write('\n');

const total = supportedChains().length;
if (keyed === 0) {
  process.stdout.write(
    `${YELLOW}No provider URLs are configured.${RESET} Every chain is using its public endpoint,\n` +
      'which is rate limited and can refuse requests. Add at least one URL for reliable runs.\n\n'
  );
} else if (defaulted > 0) {
  process.stdout.write(
    `${YELLOW}${defaulted} of ${total} chains are using a public endpoint.${RESET} ` +
      'Those are rate limited and can refuse requests under load.\n\n'
  );
} else {
  process.stdout.write(`${GREEN}All ${total} chains have a configured provider URL.${RESET}\n\n`);
}

if (config.maxGraphNodes < 10) {
  process.stdout.write(`${YELLOW}MAX_GRAPH_NODES is very low (${config.maxGraphNodes}).${RESET} Graphs will be near-empty.\n\n`);
}
