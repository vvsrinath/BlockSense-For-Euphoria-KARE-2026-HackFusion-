import { useCallback, useState } from 'react';
import { toast } from 'sonner';

export function useCopy() {
  const [copied, setCopied] = useState(false);

  const copy = useCallback(async (value: string, message = 'Copied to clipboard') => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      toast.success(message);
      setTimeout(() => setCopied(false), 1400);
    } catch {
      toast.error("Couldn't copy. Select the text and copy it manually.");
    }
  }, []);

  return { copied, copy };
}