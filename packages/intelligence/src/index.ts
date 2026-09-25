/**
 * `@blocksense/intelligence` — the analysis layer.
 *
 * ```
 * signals → scoring → explanations
 * activity → behavioral DNA
 * counterparties → relationships → graph
 * timestamps → temporal patterns
 * ```
 *
 * Every module here is headless: no React, no icons, no CSS. That is what makes
 * the same logic usable from the API, from the browser and from tests.
 */

export * from './anomaly';
export * from './scoring';
export * from './behavioral-dna';
export * from './relationship';
export * from './temporal';
export * from './network';
export * from './explanations';
export * from './analyze';
