import type { ChainId } from '@blocksense/shared';
import type { AdapterConfig } from '../core/adapter';
import { EvmAdapter } from '../evm/adapter';

export const BNB_ENV = {
  rpcUrl: 'BNB_RPC_URL',
  apiKey: 'BSCSCAN_API_KEY'
} as const;

/**
 * BNB Chain is an EVM chain, so this is the whole adapter. Note how little
 * chain-specific code exists — that is the point of the `EvmAdapter` base.
 */
export class BnbAdapter extends EvmAdapter {
  readonly id: ChainId = 'bnb';
  readonly name = 'BNB Chain';
  readonly nativeSymbol = 'BNB';
  readonly decimals = 18;
  protected readonly apiKeyEnv = BNB_ENV.apiKey;
  protected readonly evmChainId = 56;

  constructor(config: AdapterConfig) {
    super(config);
  }
}

export function createBnbAdapter(config: AdapterConfig = {}): BnbAdapter {
  return new BnbAdapter(config);
}
