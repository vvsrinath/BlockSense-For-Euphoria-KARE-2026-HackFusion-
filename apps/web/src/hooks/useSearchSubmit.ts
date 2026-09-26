import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SearchQuerySchema } from '@blocksense/shared';
import type { ChainFilter } from '@blocksense/shared';
import { detectInput } from '@blocksense/blockchain';

export interface SearchFeedback {
  tone: 'error' | 'info';
  title: string;
  message: string;
}

export function useSearchSubmit() {
  const navigate = useNavigate();
  const [pending] = useState(false);

  const go = useCallback(
    (type: 'wallet' | 'transaction', value: string, chain: ChainFilter) => {
      // The chain travels with the identifier. A 64-character hash is a valid
      // TRON id and a valid Bitcoin txid, and an `0x` address is valid on both
      // Ethereum and BNB Chain — without it the next page re-detects from the
      // shape alone and can land on the wrong chain.
      const suffix = chain !== 'all' && chain ? `?chain=${chain}` : '';
      navigate(
        type === 'wallet'
          ? `/wallet/${encodeURIComponent(value)}${suffix}`
          : `/analyze/tx/${encodeURIComponent(value)}${suffix}`
      );
    },
    [navigate]
  );

  const submit = useCallback(
    async (raw: string, chain: ChainFilter): Promise<SearchFeedback | null> => {
      const parsed = SearchQuerySchema.safeParse(raw);
      if (!parsed.success) {
        return { tone: 'error', title: "We couldn't identify this input.", message: parsed.error.issues[0]?.message ?? 'Check the value and try again.' };
      }
      const value = parsed.data;
      const detection = detectInput(value, chain);

      if (detection.kind === 'shortened') {
        // A truncated identifier cannot be looked up: providers index full
        // addresses and hashes only. Guessing at a match would be worse than
        // asking for the whole value.
        return {
          tone: 'error',
          title: "Shortened values can't be looked up.",
          message: 'Paste the full address or transaction hash and try again.'
        };
      }

      if (detection.kind === 'block') {
        return {
          tone: 'info',
          title: 'Block lookups are coming soon.',
          message: 'Block search activates once the BlockSense backend is connected. Try a transaction or wallet for now.'
        };
      }

      if (!detection.action) {
        return { tone: 'error', title: "We couldn't identify this input.", message: 'Check the address or transaction hash and try again.' };
      }

      go(detection.action, value, chain);
      return null;
    },
    [go]
  );

  return { submit, pending };
}