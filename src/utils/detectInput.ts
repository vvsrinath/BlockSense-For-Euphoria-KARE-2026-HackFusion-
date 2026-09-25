import type { ChainFilter, ChainId } from '../types/chain';

export type DetectedKind = 'address' | 'transaction' | 'block' | 'shortened' | 'unknown';

export interface Detection {
  kind: DetectedKind;
  chains: ChainId[];
  label: string;
  action?: 'wallet' | 'transaction';
}

const EVM_ADDRESS = /^0x[a-fA-F0-9]{40}$/;
const EVM_TX = /^0x[a-fA-F0-9]{64}$/;
const HEX_64 = /^[a-fA-F0-9]{64}$/;
const BTC_ADDRESS = /^(bc1[a-z0-9]{25,62}|[13][a-km-zA-HJ-NP-Z1-9]{25,34})$/;
const TRON_ADDRESS = /^T[1-9A-HJ-NP-Za-km-z]{33}$/;
const SOL_SIGNATURE = /^[1-9A-HJ-NP-Za-km-z]{86,88}$/;
const SOL_ADDRESS = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
const BLOCK = /^\d{1,12}$/;
const SHORTENED = /^[A-Za-z0-9]{3,14}(\.{2,3}|…)[A-Za-z0-9]{2,14}$/;

export function detectInput(raw: string, hint: ChainFilter = 'all'): Detection {
  const value = raw.trim();

  if (EVM_TX.test(value)) {
    const chain: ChainId = hint === 'bnb' ? 'bnb' : 'ethereum';
    return {
      kind: 'transaction',
      chains: [chain],
      label: `${chain === 'bnb' ? 'BNB Chain' : 'Ethereum'} transaction detected`,
      action: 'transaction'
    };
  }
  if (EVM_ADDRESS.test(value)) {
    const chain: ChainId = hint === 'bnb' ? 'bnb' : 'ethereum';
    return {
      kind: 'address',
      chains: ['ethereum', 'bnb'],
      label: `Likely ${chain === 'bnb' ? 'BNB Chain' : 'Ethereum'} address`,
      action: 'wallet'
    };
  }
  if (HEX_64.test(value)) {
    const label =
    hint === 'bitcoin' ? 'Bitcoin transaction detected' : hint === 'tron' ? 'TRON transaction detected' : 'Bitcoin or TRON transaction detected';
    return { kind: 'transaction', chains: ['bitcoin', 'tron'], label, action: 'transaction' };
  }
  if (BTC_ADDRESS.test(value)) {
    return { kind: 'address', chains: ['bitcoin'], label: 'Bitcoin address detected', action: 'wallet' };
  }
  if (TRON_ADDRESS.test(value)) {
    return { kind: 'address', chains: ['tron'], label: 'TRON address detected', action: 'wallet' };
  }
  if (SOL_SIGNATURE.test(value)) {
    return { kind: 'transaction', chains: ['solana'], label: 'Solana transaction detected', action: 'transaction' };
  }
  if (SOL_ADDRESS.test(value)) {
    return { kind: 'address', chains: ['solana'], label: 'Likely Solana address', action: 'wallet' };
  }
  if (BLOCK.test(value)) {
    return { kind: 'block', chains: [], label: 'Block number' };
  }
  if (SHORTENED.test(value)) {
    return { kind: 'shortened', chains: [], label: 'Shortened address or hash' };
  }
  return { kind: 'unknown', chains: [], label: "We couldn't identify this input." };
}