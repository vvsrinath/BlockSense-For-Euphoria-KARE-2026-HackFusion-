import { useCallback, useEffect, useState } from 'react';

type Status = 'loading' | 'success' | 'error';

interface State<T> {
  status: Status;
  data: T | null;
  error: Error | null;
}

const seenKeys = new Set<string>();

/**
 * Runs a loader while ticking through analysis steps, so users see progress.
 * Results already seen this session appear instantly.
 */
export function useProgressiveLoad<T>(loader: () => Promise<T>, key: string, stepCount: number, stepMs = 150) {
  const [state, setState] = useState<State<T>>({ status: 'loading', data: null, error: null });
  const [step, setStep] = useState(0);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const steps = seenKeys.has(key) ? 0 : stepCount;
    let current = 0;
    let result: {ok: true;data: T;} | {ok: false;error: Error;} | null = null;

    setState({ status: 'loading', data: null, error: null });
    setStep(0);

    const finish = () => {
      if (cancelled || !result || current < steps) return;
      if (result.ok) {
        seenKeys.add(key);
        setState({ status: 'success', data: result.data, error: null });
      } else {
        setState({ status: 'error', data: null, error: result.error });
      }
    };

    const timer = steps ?
    setInterval(() => {
      current += 1;
      setStep(current);
      if (current >= steps) {
        clearInterval(timer);
        finish();
      }
    }, stepMs) :
    undefined;

    loader().
    then((data) => {
      result = { ok: true, data };
      finish();
    }).
    catch((e: unknown) => {
      result = { ok: false, error: e instanceof Error ? e : new Error(String(e)) };
      if (timer) clearInterval(timer);
      current = steps;
      finish();
    });

    return () => {
      cancelled = true;
      if (timer) clearInterval(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, attempt]);

  const retry = useCallback(() => setAttempt((a) => a + 1), []);
  return { ...state, step, retry };
}