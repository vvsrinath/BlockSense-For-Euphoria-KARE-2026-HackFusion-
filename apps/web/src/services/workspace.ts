/**
 * A small local store for records the user has actually looked at.
 *
 * The home page shows "transactions opened in this workspace", which is a local
 * history rather than a chain feed — no public provider can tell one browser
 * what *it* has viewed. Keeping it in `localStorage` means the list survives a
 * reload, and keeping it small means it cannot grow without bound.
 *
 * This is user history, not chain data. Nothing here is presented as if it came
 * from a node.
 */

import type { Transaction, Wallet } from '@blocksense/shared';

/** Bounded so a heavy session cannot fill the origin's storage quota. */
const MAX_ENTRIES = 40;
const STORAGE_KEY = 'blocksense.workspace.v1';

interface Workspace {
  transactions: Transaction[];
  wallets: Wallet[];
}

const EMPTY: Workspace = { transactions: [], wallets: [] };

function read(): Workspace {
  try {
    const raw = globalThis.localStorage?.getItem(STORAGE_KEY);
    if (!raw) return EMPTY;
    const parsed = JSON.parse(raw) as Partial<Workspace>;
    return {
      transactions: Array.isArray(parsed.transactions) ? parsed.transactions.slice(0, MAX_ENTRIES) : [],
      wallets: Array.isArray(parsed.wallets) ? parsed.wallets.slice(0, MAX_ENTRIES) : []
    };
  } catch {
    // Corrupt or unavailable storage must not break the app.
    return EMPTY;
  }
}

function write(workspace: Workspace): void {
  try {
    globalThis.localStorage?.setItem(STORAGE_KEY, JSON.stringify(workspace));
  } catch {
    // Private browsing or a full quota: the session still works, it just will
    // not remember.
  }
}

function upsert<T extends { hash?: string; address?: string }>(list: T[], item: T, key: 'hash' | 'address'): T[] {
  const value = String(item[key] ?? '').toLowerCase();
  const rest = list.filter((existing) => String(existing[key] ?? '').toLowerCase() !== value);
  return [item, ...rest].slice(0, MAX_ENTRIES);
}

/** Record a transaction the user opened, newest first. */
export function rememberTransaction(transaction: Transaction): void {
  const workspace = read();
  write({ ...workspace, transactions: upsert(workspace.transactions, transaction, 'hash') });
}

/** Record a wallet the user opened, newest first. */
export function rememberWallet(wallet: Wallet): void {
  const workspace = read();
  write({ ...workspace, wallets: upsert(workspace.wallets, wallet, 'address') });
}

export function recentTransactions(): Transaction[] {
  return [...read().transactions].sort((a, b) => b.timestamp - a.timestamp);
}

export function recentWallets(): Wallet[] {
  return read().wallets;
}

export function knownTransaction(hash: string): Transaction | undefined {
  const value = hash.trim().toLowerCase();
  return read().transactions.find((t) => t.hash.toLowerCase() === value);
}

export function knownWallet(address: string): Wallet | undefined {
  const value = address.trim().toLowerCase();
  return read().wallets.find((w) => w.address.toLowerCase() === value);
}

export function clearWorkspace(): void {
  try {
    globalThis.localStorage?.removeItem(STORAGE_KEY);
  } catch {
    // Nothing to do: the data is already unreachable.
  }
}
