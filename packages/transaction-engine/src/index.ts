/**
 * `@blocksense/transaction-engine` — turning a chain-native transaction into
 * something a human can trust.
 *
 * The pipeline is deliberately explicit:
 *
 * ```
 * raw chain data → parse → amount → assets → normalize → Transaction
 * ```
 *
 * Each stage has one job. Amount arithmetic never uses floating point, because
 * a token amount that is off by a rounding error is worse than no answer.
 */

export * from './parser';
export * from './amount';
export * from './assets';
export * from './normalization';
export * from './types';
