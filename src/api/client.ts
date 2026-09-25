// Mock transport. Replace `mockRequest` with real fetch calls to the BlockSense backend later —
// components only consume the normalized objects returned by the api/* modules.

export class ProviderError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.code = code;
    this.name = 'ProviderError';
  }
}

export function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function simulatedFailure(): boolean {
  try {
    const raw = localStorage.getItem('blocksense.settings');
    return raw ? JSON.parse(raw).simulateError === true : false;
  } catch {
    return false;
  }
}

export async function mockRequest<T>(fn: () => T, latency = 120): Promise<T> {
  await wait(latency);
  if (simulatedFailure()) {
    throw new ProviderError('RPC_ERROR_429', 'Upstream provider rate limit exceeded (eth-mainnet, retry-after: 30s).');
  }
  return fn();
}

export function sameValue(a: string, b: string): boolean {
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}