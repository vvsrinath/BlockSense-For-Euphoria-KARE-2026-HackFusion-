/**
 * Input detection.
 *
 * The search box is the entry point to the whole product, so a misdetection
 * sends an investigator to the wrong chain. These tests cover the ambiguous
 * cases that actually occur: a 64-character hex string is a valid Bitcoin txid
 * and a valid TRON hash, and detection must say so rather than guessing.
 */

import { describe, expect, it } from 'vitest';
import { detectInput, isSupportedChain, supportedChains, explorerUrl, getChain } from '@blocksense/blockchain';

const EVM_TX = '0x4a5e1b4b0c0d3e5f6a7b8c9d0e1f2a3b4c5d6e7f8091a2b3c4d5e6f708192a3b';
const EVM_ADDRESS = '0x742d35Cc6634C0532925a3b844Bc454e4438f44e';
const BTC_TX = '4a5e1b4b0c0d3e5f6a7b8c9d0e1f2a3b4c5d6e7f8091a2b3c4d5e6f708192a3b';
const BTC_ADDRESS = 'bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq';
const TRON_ADDRESS = 'TLa2f6VPqDgRE67v1736s7bJ8Ray5wYjU7';
const SOL_SIGNATURE = '5wHu1qwD4kMV1t9N5v6pP2xR8sT3yF7gH2jK9dLmN1aB2cC3dE4fG5hp6jK7mN8oP9qRosT1uV2wX3yZ4aB5cD6e';

describe('detectInput', () => {
  it('detects an EVM transaction hash', () => {
    const result = detectInput(EVM_TX);
    expect(result.kind).toBe('transaction');
    expect(result.action).toBe('transaction');
  });

  it('honours a BNB hint for an EVM hash, which is otherwise ambiguous', () => {
    expect(detectInput(EVM_TX, 'bnb').chains).toEqual(['bnb']);
    expect(detectInput(EVM_TX, 'ethereum').chains).toEqual(['ethereum']);
  });

  it('detects an EVM address and offers both EVM chains', () => {
    const result = detectInput(EVM_ADDRESS);
    expect(result.kind).toBe('address');
    expect(result.action).toBe('wallet');
    expect(result.chains).toContain('ethereum');
    expect(result.chains).toContain('bnb');
  });

  it('reports both Bitcoin and TRON for a bare 64-character hex string', () => {
    // The honest answer: these bytes are valid in both chains.
    const result = detectInput(BTC_TX);
    expect(result.kind).toBe('transaction');
    expect(result.chains).toEqual(['bitcoin', 'tron']);
  });

  it('narrows a hex transaction with an explicit hint', () => {
    expect(detectInput(BTC_TX, 'bitcoin').chains).toEqual(['bitcoin']);
    expect(detectInput(BTC_TX, 'tron').chains).toEqual(['tron']);
  });

  it('detects a Bitcoin bech32 address', () => {
    const result = detectInput(BTC_ADDRESS);
    expect(result.kind).toBe('address');
    expect(result.chains).toEqual(['bitcoin']);
  });

  it('detects a TRON address', () => {
    expect(detectInput(TRON_ADDRESS).chains).toEqual(['tron']);
  });

  it('detects a Solana signature', () => {
    const result = detectInput(SOL_SIGNATURE);
    expect(result.kind).toBe('transaction');
    expect(result.chains).toEqual(['solana']);
  });

  it('recognises a block number without pretending to know the chain', () => {
    const result = detectInput('19283411');
    expect(result.kind).toBe('block');
    expect(result.chains).toEqual([]);
  });

  it('flags a truncated identifier rather than searching for it', () => {
    expect(detectInput('0x742d...0bEb').kind).toBe('shortened');
  });

  it('returns unknown for something that is not an identifier at all', () => {
    expect(detectInput('hello world').kind).toBe('unknown');
  });

  it('tolerates surrounding whitespace', () => {
    expect(detectInput(`  ${EVM_ADDRESS}  `).kind).toBe('address');
  });
});

describe('chain registry', () => {
  it('lists the five supported chains', () => {
    expect(supportedChains()).toEqual(['ethereum', 'bnb', 'tron', 'solana', 'bitcoin']);
  });

  it('validates a chain id', () => {
    expect(isSupportedChain('ethereum')).toBe(true);
    expect(isSupportedChain('dogecoin')).toBe(false);
  });

  it('builds an explorer deep link for a transaction', () => {
    expect(explorerUrl('ethereum', '0xabc', 'tx')).toBe('https://etherscan.io/tx/0xabc');
  });

  it('builds an explorer deep link for an address', () => {
    expect(explorerUrl('bitcoin', 'bc1q', 'address')).toBe('https://mempool.space/address/bc1q');
  });

  it('returns metadata for a known chain', () => {
    expect(getChain('solana').symbol).toBe('SOL');
    expect(getChain('solana').latestLabel).toBe('Latest slot');
  });
});
