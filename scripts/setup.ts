/**
 * First-run setup.
 *
 * Run with `pnpm setup`. Creates `.env` from `.env.example` if it is missing and
 * reports the next steps. Deliberately does not install dependencies: `pnpm
 * install` is the one command the README asks for, and having setup run it too
 * would hide a genuine install failure behind a wrapper.
 */

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const example = resolve(root, '.env.example');
const envFile = resolve(root, '.env');

const BOLD = '\x1b[1m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const DIM = '\x1b[2m';
const RESET = '\x1b[0m';

function say(text = ''): void {
  process.stdout.write(`${text}\n`);
}

say(`\n${BOLD}BlockSense setup${RESET}\n`);

if (!existsSync(example)) {
  say(`${YELLOW}  .env.example is missing; skipping environment setup.${RESET}\n`);
} else if (existsSync(envFile)) {
  say(`  ${GREEN}✓${RESET} .env already exists — leaving it untouched.`);
} else {
  writeFileSync(envFile, readFileSync(example, 'utf8'));
  say(`  ${GREEN}✓${RESET} Created .env from .env.example.`);
  say(`  ${DIM}  Every value is empty, so the app starts in mock mode.${RESET}`);
}

say();
say(`${BOLD}Next steps${RESET}`);
say(`  1. ${DIM}pnpm install${RESET}          install dependencies`);
say(`  2. ${DIM}pnpm dev${RESET}              start the web app on http://localhost:5173`);
say(`  3. ${DIM}pnpm dev:api${RESET}          start the API on http://localhost:8787`);
say();
say(`${BOLD}Verify${RESET}`);
say(`  ${DIM}pnpm typecheck${RESET}    type-check every package`);
say(`  ${DIM}pnpm lint${RESET}         lint the repository`);
say(`  ${DIM}pnpm test${RESET}         run the test suite`);
say(`  ${DIM}pnpm check:env${RESET}    see which chains are live`);
say();
say(`${DIM}Mock mode needs no configuration, so you can skip to step 1.${RESET}\n`);
