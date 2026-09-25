import type { ChainId } from '../types/chain';
import { BNB_WALLET, BTC_TX_HASH, DEMO_TX_HASH, SOLANA_WALLET, TRON_TX_HASH } from './mockAddresses';

export interface SearchExample {
  label: string;
  chain: ChainId;
  to: string;
}

export const searchExamples: SearchExample[] = [
{ label: 'Ethereum transaction', chain: 'ethereum', to: `/analyze/tx/${DEMO_TX_HASH}` },
{ label: 'Bitcoin transaction', chain: 'bitcoin', to: `/analyze/tx/${BTC_TX_HASH}` },
{ label: 'TRON transaction', chain: 'tron', to: `/analyze/tx/${TRON_TX_HASH}` },
{ label: 'Solana wallet', chain: 'solana', to: `/wallet/${SOLANA_WALLET}` },
{ label: 'BNB wallet', chain: 'bnb', to: `/wallet/${BNB_WALLET}` }];