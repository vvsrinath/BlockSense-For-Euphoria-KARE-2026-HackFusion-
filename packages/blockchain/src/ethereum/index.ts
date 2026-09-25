import type { ChainId } from '@blocksense/shared';
import type { AdapterConfig } from '../core/adapter';
import { EvmAdapter } from '../evm/adapter';

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
  protected readonly apiKeyEnv = ETH_ENV.apiKey;
  protected readonly evmChainId = 1;

  constructor(config: AdapterConfig) {
    super(config);
  }
}

export function createEthereumAdapter(config: AdapterConfig = {}): EthereumAdapter {
  return new EthereumAdapter(config);
}
