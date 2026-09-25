/**
 * TRON contract-call decoding and address handling.
 *
 * These are the decoders that turn raw node responses into the numbers and
 * names the product displays. A wrong answer here is not a cosmetic bug: a
 * mistyped string offset made every token name unreadable and left `decimals`
 * as the only thing the UI could trust.
 */

import { describe, expect, it } from 'vitest';
import {
  abiDecodeString,
  abiDecodeUint,
  isTronAddress,
  isTronHash,
  normalizeTronAddress,
  scaleDown,
  symbolFromContract,
  tronAddressToHex
} from '@blocksense/blockchain/tron';

/** Real constant-call results, captured from the TRON node. */
const DECIMALS_HEX = '0000000000000000000000000000000000000000000000000000000000000006';
const NAME_WINK_HEX =
  '0000000000000000000000000000000000000000000000000000000000000020' +
  '0000000000000000000000000000000000000000000000000000000000000004' +
  '57494e4b00000000000000000000000000000000000000000000000000000000';
const NAME_TETHER_USD_HEX =
  '0000000000000000000000000000000000000000000000000000000000000020' +
  '000000000000000000000000000000000000000000000000000000000000000a' +
  '5465746865722055534400000000000000000000000000000000000000000000';

describe('abiDecodeUint', () => {
  it('reads a 32-byte word', () => {
    expect(abiDecodeUint(DECIMALS_HEX)).toBe(6);
  });

  it('reads zero rather than failing', () => {
    expect(abiDecodeUint('0'.repeat(64))).toBe(0);
  });

  it('rejects anything too short to be a word', () => {
    expect(abiDecodeUint('06')).toBeNull();
    expect(abiDecodeUint('')).toBeNull();
  });
});

describe('abiDecodeString', () => {
  it('decodes a name from real node output', () => {
    expect(abiDecodeString(NAME_WINK_HEX)).toBe('WINK');
  });

  it('decodes a name containing a space', () => {
    // Token names like "Tether USD" are ordinary; rejecting spaces left the
    // product rendering a contract address where a name belonged.
    expect(abiDecodeString(NAME_TETHER_USD_HEX)).toBe('Tether USD');
  });

  it('reads the length at a byte offset, not a character offset', () => {
    // The head word holds a byte offset (32) while the payload is a hex string.
    // Reading the length at character 32 instead of 64 yields a number larger
    // than any plausible length, so the decode silently returned null.
    const wrongOffset = Number.parseInt(NAME_WINK_HEX.slice(32, 96), 16);
    expect(wrongOffset).toBeGreaterThan(128);
    expect(abiDecodeString(NAME_WINK_HEX)).not.toBeNull();
  });

  it('handles a name with an inline head of zero', () => {
    const inline =
      '0000000000000000000000000000000000000000000000000000000000000020' +
      '0000000000000000000000000000000000000000000000000000000000000003' +
      '41424300000000000000000000000000000000000000000000000000000000';
    expect(abiDecodeString(inline)).toBe('ABC');
  });

  it('rejects a length that runs past the payload', () => {
    const truncated =
      '0000000000000000000000000000000000000000000000000000000000000020' +
      '00000000000000000000000000000000000000000000000000000000000000ff' +
      '414243';
    expect(abiDecodeString(truncated)).toBeNull();
  });

  it('rejects an offset that is not word aligned', () => {
    const misaligned =
      '0000000000000000000000000000000000000000000000000000000000000001' +
      '0000000000000000000000000000000000000000000000000000000000000004' +
      '57494e4b00000000000000000000000000000000000000000000000000000000';
    expect(abiDecodeString(misaligned)).toBeNull();
  });

  it('rejects non-utf8 bytes rather than returning mojibake', () => {
    const invalid =
      '0000000000000000000000000000000000000000000000000000000000000020' +
      '0000000000000000000000000000000000000000000000000000000000000002' +
      'fffd000000000000000000000000000000000000000000000000000000000';
    expect(abiDecodeString(invalid)).toBeNull();
  });
});

describe('scaleDown', () => {
  it('scales a raw amount by the token decimals', () => {
    // The live WINK example: 25668752000000 base units at 6 decimals.
    expect(scaleDown(25668752000000n, 6)).toBe('25668752');
  });

  it('keeps a fractional part and trims trailing zeros', () => {
    expect(scaleDown(1234567n, 6)).toBe('1.234567');
    expect(scaleDown(1500000n, 6)).toBe('1.5');
  });

  it('returns the raw value when decimals are unknown', () => {
    expect(scaleDown(25668752000000n, 0)).toBe('25668752000000');
  });
});

describe('address handling', () => {
  const ADDRESS = 'TLa2f6VPqDgRE67v1736s7bJ8Ray5wYjU7';

  it('round-trips an address to the hex form the node expects', () => {
    expect(tronAddressToHex(ADDRESS)).toBe('4174472e7d35395a6b5add427eecb7f4b62ad2b071');
  });

  it('validates the Base58Check checksum', () => {
    expect(isTronAddress(ADDRESS)).toBe(true);
    // One character changed, so the checksum no longer agrees.
    expect(isTronAddress('TLa2f6VPqDgRE67v1736s7bJ8Ray5wYjU8')).toBe(false);
  });

  it('rejects a plain 0x address', () => {
    expect(isTronAddress('0x28C6c06298d514Db089934071355E5743bf21d60')).toBe(false);
  });

  it('recognises transaction hashes', () => {
    expect(isTronHash('b40bfdb07e4e4b466582328917bb8f4aef0cb1d8948bab794771eae9d4213352')).toBe(true);
    expect(isTronHash('not-a-hash')).toBe(false);
  });

  it('normalises the hex-prefixed form back to Base58Check', () => {
    expect(normalizeTronAddress('4174472e7d35395a6b5add427eecb7f4b62ad2b071')).toBe(ADDRESS);
  });
});

describe('symbolFromContract', () => {
  it('produces a short label when a contract will not name itself', () => {
    // The node returns an empty result for symbol() on many TRC-20 contracts,
    // so this is the fallback a reader actually sees.
    const label = symbolFromContract('TLa2f6VPqDgRE67v1736s7bJ8Ray5wYjU7');
    expect(label.length).toBeGreaterThan(0);
    expect(label.length).toBeLessThan(24);
  });
});
