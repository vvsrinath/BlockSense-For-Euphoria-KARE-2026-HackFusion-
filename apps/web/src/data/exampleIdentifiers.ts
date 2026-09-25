/**
 * Real on-chain identifiers used for examples and "try it" links.
 *
 * Every value here was resolved against a live public endpoint. Fabricated
 * addresses are deliberately avoided: a demo link that 404s against the real
 * API teaches the opposite of what this product is for. If a chain has no
 * identifier we have verified, we show a wallet example instead of inventing a
 * transaction hash.
 *
 * These are public, well-known addresses (exchange hot wallets, canonical token
 * contracts). They carry no user data and nothing here implies endorsement.
 */

/* Ethereum / BNB Chain — Binance hot wallet, heavily used on both chains. */
export const EVM_EXAMPLE_WALLET = '0x28C6c06298d514Db089934071355E5743bf21d60';

/* Bitcoin — a wallet with enough history to produce a real behavioural profile. */
export const BTC_EXAMPLE_WALLET = 'bc1qgdjqv0av3q56jvd82tkdjpy7gdp9ut8tlqmgrpmv24sq90ecnvqqjwvw97';

/* Solana — wrapped SOL mint: permanently active, so always returns data. */
export const SOL_EXAMPLE_WALLET = '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM';
export const SOL_EXAMPLE_TX =
  '2s3KJu2sYriyebHBLkQcboiFR6R9Hi1zJwdv2hAMJCfLoKDRZwu9isM8gxn9hSvRznVDPUY469CLTnwmLaA4bhRS';

/* TRON — a wallet with deep history, plus one confirmed TRC-20 transfer. */
export const TRON_EXAMPLE_WALLET = 'TLa2f6VPqDgRE67v1736s7bJ8Ray5wYjU7';
export const TRON_EXAMPLE_TX =
  'b40bfdb07e4e4b466582328917bb8f4aef0cb1d8948bab794771eae9d4213352';

/**
 * Canonical token contracts.
 *
 * USDC and USDT addresses are chain-specific and publicly documented, so
 * treating them as identifiers is safe — unlike an invented "my token".
 */
export const USDC_ETH_CONTRACT = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48';
export const USDT_ETH_CONTRACT = '0xdAC17F958D2ee523a2206206994597C13D831ec7';
