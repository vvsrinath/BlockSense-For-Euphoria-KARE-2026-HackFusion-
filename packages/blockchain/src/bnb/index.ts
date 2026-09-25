import type { ChainId, Transaction } from '@blocksense/shared';
import type { AdapterConfig } from '../core/adapter';
import { EvmAdapter, fromWei } from '../evm/adapter';
import type { EvmRawTransaction } from '../evm/adapter';

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

  constructor(config: AdapterConfig) {
    super(config);
  }

  protected buildTransaction(raw: EvmRawTransaction): Transaction {
    const amount = fromWei(raw.value, this.decimals);
    return {
      hash: raw.hash,
      chain: this.id,
      from: raw.from,
      to: raw.to ?? '',
      timestamp: raw.timestamp ?? 0,
      status: raw.blockNumber ? 'confirmed' : 'pending',
      block: raw.blockNumber ? Number(BigInt(raw.blockNumber)) : 0,
      confirmations: raw.blockNumber ? 1 : 0,
      asset: {
        type: 'native',
        name: this.name,
        symbol: this.nativeSymbol,
        amount: String(amount)
      },
      summary: [`${amount} ${this.nativeSymbol} transferred`],
      technical: [{ label: 'Input data', value: raw.input ?? '0x' }],
      related: []
    };
  }
}

export function createBnbAdapter(config: AdapterConfig = {}): BnbAdapter {
  return new BnbAdapter(config);
}
