import type { ChainId } from '@blocksense/shared';
import {
  BTC_EXAMPLE_WALLET,
  EVM_EXAMPLE_WALLET,
  SOL_EXAMPLE_TX,
  SOL_EXAMPLE_WALLET,
  TRON_EXAMPLE_TX,
  TRON_EXAMPLE_WALLET
} from './exampleIdentifiers';

/**
 * Search suggestions shown on an empty search box.
 *
 * Each entry points at a real, verified identifier, and each chain's example
 * was chosen because it returns enough live data to be worth looking at. We
 * show a wallet where we have not verified a transaction hash rather than
 * offering a link that cannot resolve.
 */
export interface SearchExample {
  label: string;
  chain: ChainId;
  to: string;
}

export const searchExamples: SearchExample[] = [
  // Every link names its chain. Shape detection alone reads a bare-64-hex id as
  // Bitcoin first and an `0x` address as Ethereum first, so the TRON and BNB
  // examples would otherwise open on the wrong chain.
  { label: 'TRON transaction', chain: 'tron', to: `/analyze/tx/${TRON_EXAMPLE_TX}?chain=tron` },
  { label: 'Solana transaction', chain: 'solana', to: `/analyze/tx/${SOL_EXAMPLE_TX}?chain=solana` },
  { label: 'TRON wallet', chain: 'tron', to: `/wallet/${TRON_EXAMPLE_WALLET}?chain=tron` },
  { label: 'Solana wallet', chain: 'solana', to: `/wallet/${SOL_EXAMPLE_WALLET}?chain=solana` },
  { label: 'Bitcoin wallet', chain: 'bitcoin', to: `/wallet/${BTC_EXAMPLE_WALLET}?chain=bitcoin` },
  { label: 'Ethereum wallet', chain: 'ethereum', to: `/wallet/${EVM_EXAMPLE_WALLET}?chain=ethereum` },
  { label: 'BNB wallet', chain: 'bnb', to: `/wallet/${EVM_EXAMPLE_WALLET}?chain=bnb` }
];

/** The example used by the landing page call to action: a real TRC-20 transfer. */
export const FEATURED_EXAMPLE_TX = { chain: 'tron' as ChainId, hash: TRON_EXAMPLE_TX };

/** The example used when the network graph is opened without an address. */
export const DEFAULT_GRAPH_EXAMPLE = { chain: 'tron' as ChainId, address: TRON_EXAMPLE_WALLET };
