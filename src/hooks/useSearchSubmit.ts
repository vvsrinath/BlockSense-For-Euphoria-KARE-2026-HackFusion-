import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { resolveShortForm } from '../api/search';
import type { ChainFilter } from '../types/chain';
import { SearchQuerySchema } from '../types/schemas';
import { detectInput } from '../utils/detectInput';

export interface SearchFeedback {
  tone: 'error' | 'info';
  title: string;
  message: string;
}

export function useSearchSubmit() {
  const navigate = useNavigate();
  const [pending, setPending] = useState(false);

  const go = useCallback(
    (type: 'wallet' | 'transaction', value: string) => {
      navigate(type === 'wallet' ? `/wallet/${encodeURIComponent(value)}` : `/analyze/tx/${encodeURIComponent(value)}`);
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
        setPending(true);
        try {
          const match = await resolveShortForm(value);
          if (match) {
            go(match.type, match.value);
            return null;
          }
        } catch {
          return { tone: 'error', title: "We couldn't retrieve the blockchain data right now.", message: 'Try again in a moment.' };
        } finally {
          setPending(false);
        }
        return { tone: 'error', title: "Shortened values can't be looked up.", message: 'Paste the full address or transaction hash and try again.' };
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

      go(detection.action, value);
      return null;
    },
    [go]
  );

  return { submit, pending };
}