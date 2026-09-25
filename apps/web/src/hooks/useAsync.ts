import { useCallback, useEffect, useState } from 'react';

interface AsyncState<T> {
  status: 'loading' | 'success' | 'error';
  data: T | null;
  error: Error | null;
}

/** Loads data for a key. Keeps the previous data visible while refreshing. */
export function useAsync<T>(loader: () => Promise<T>, key: string) {
  const [state, setState] = useState<AsyncState<T>>({ status: 'loading', data: null, error: null });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setState((s) => ({ ...s, status: 'loading', error: null }));
    loader().
    then((data) => !cancelled && setState({ status: 'success', data, error: null })).
    catch((e: unknown) => !cancelled && setState({ status: 'error', data: null, error: e instanceof Error ? e : new Error(String(e)) }));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, attempt]);

  const retry = useCallback(() => setAttempt((a) => a + 1), []);
  return { ...state, retry };
}