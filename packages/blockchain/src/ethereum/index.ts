import type { ChainId, Transaction } from '@blocksense/shared';
import type { AdapterConfig } from '../core/adapter';
import { EvmAdapter, fromWei } from '../evm/adapter';
import type { EvmRawTransaction } from '../evm/adapter';

/** Environment variable names Ethereum reads. See `.env.example`. */
export const ETH_ENV = {
  rpcUrl: 'ETHEREUM_RPC_URL',
  apiKey: 'ETHERSCAN_API_KEY'
} as const;

export class EthereumAdapter extends EvmAdapter {
  readonly id: ChainId = 'ethereum';
  readonly name = 'Ethereum';
  readonly nativeSymbol = 'ETH';
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

export function createEthereumAdapter(config: AdapterConfig = {}): EthereumAdapter {
  return new EthereumAdapter(config);
}
