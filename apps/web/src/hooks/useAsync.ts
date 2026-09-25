import { useCallback, useEffect, useRef, useState } from 'react';

interface AsyncState<T> {
  status: 'loading' | 'success' | 'error';
  data: T | null;
  error: Error | null;
}

/** Attempts made automatically before a retryable failure is shown to anyone. */
const AUTO_ATTEMPTS = 3;

/** First delay between automatic attempts, doubling each time. */
const AUTO_RETRY_BASE_MS = 700;

/**
 * Whether trying again could plausibly work.
 *
 * The API client already knows this, so the rule lives in one place rather than
 * being restated here. A rate limit or a provider blip is worth retrying; a
 * missing transaction is not, and retrying it only makes the user wait longer
 * for the same answer.
 */
function isRetryable(error: unknown): boolean {
  if (error && typeof error === 'object' && 'isRetryable' in error) {
    return Boolean((error as { isRetryable?: boolean }).isRetryable);
  }
  // A network-level failure never reached the API, so it is always worth
  // another attempt: `TypeError: Failed to fetch` and friends.
  return error instanceof TypeError;
}

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Loads data for a key, retrying transient failures on its own.
 *
 * Most of what goes wrong in this product is a shared public provider declining
 * a request for a few seconds. Surfacing that as a dead-end error page — which
 * is what happened — made a temporary condition look like a broken feature, so
 * retryable failures are absorbed here instead. Someone only sees an error once
 * the retries are exhausted, and by then it is worth showing.
 *
 * The previous data stays visible while refreshing, so a retry does not blank
 * the page.
 */
export function useAsync<T>(loader: () => Promise<T>, key: string) {
  const [state, setState] = useState<AsyncState<T>>({ status: 'loading', data: null, error: null });
  const [attempt, setAttempt] = useState(0);
  // Guards against setting state after unmount, and against a slow response from
  // a superseded attempt overwriting a newer one.
  const runId = useRef(0);

  useEffect(() => {
    let cancelled = false;
    const id = runId.current + 1;
    runId.current = id;
    const isCurrent = () => !cancelled && runId.current === id;

    setState((s) => ({ ...s, status: 'loading', error: null }));

    const run = async () => {
      for (let tryIndex = 0; ; tryIndex += 1) {
        try {
          const data = await loader();
          if (isCurrent()) setState({ status: 'success', data, error: null });
          return;
        } catch (e: unknown) {
          const canRetry = tryIndex < AUTO_ATTEMPTS - 1 && isRetryable(e);
          if (!canRetry) {
            if (isCurrent()) {
              setState({ status: 'error', data: null, error: e instanceof Error ? e : new Error(String(e)) });
            }
            return;
          }
          // Jittered so a burst of components does not retry in lockstep and
          // re-trip the same rate limit together.
          const delay = AUTO_RETRY_BASE_MS * 2 ** tryIndex;
          await wait(delay + Math.random() * delay * 0.3);
          if (!isCurrent()) return;
        }
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, attempt]);

  const retry = useCallback(() => setAttempt((a) => a + 1), []);
  return { ...state, retry };
}
