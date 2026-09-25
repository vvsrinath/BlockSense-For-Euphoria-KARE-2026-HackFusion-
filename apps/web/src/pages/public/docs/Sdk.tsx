import { useState } from 'react';
import { CheckIcon, CopyIcon } from 'lucide-react';
import { Panel } from '@blocksense/ui';
import { TRON_EXAMPLE_TX } from '../../../data/exampleIdentifiers';

function Code({ children }: { children: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="relative">
      <pre className="overflow-x-auto rounded-xl bg-subtle p-4 font-mono text-xs leading-relaxed text-ink">
        {children}
      </pre>
      <button
        type="button"
        aria-label="Copy code"
        onClick={() => {
          void navigator.clipboard?.writeText(children);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        }}
        className="absolute right-2 top-2 rounded-md p-1.5 text-muted transition-colors duration-150 hover:bg-surface hover:text-ink">
        {copied ? <CheckIcon className="h-3.5 w-3.5 text-success" aria-hidden="true" /> : <CopyIcon className="h-3.5 w-3.5" aria-hidden="true" />}
      </button>
    </div>
  );
}

/**
 * SDK documentation.
 *
 * The typed client is described here rather than shipped as a package yet. The
 * API is plain JSON with a stable envelope, so `fetch` is a complete integration
 * today and the wrapper is a convenience rather than a dependency.
 */
export function Sdk() {
  return (
    <div className="space-y-10">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-ink md:text-[28px]">SDK</h1>
        <p className="mt-2 text-[15px] leading-relaxed text-muted">
          The API is plain JSON over HTTP, so <code className="rounded bg-subtle px-1.5 py-0.5 font-mono text-xs">fetch</code> is
          already a complete integration. A published, typed client is on the roadmap; everything below
          works today without one.
        </p>
      </header>

      <section>
        <h2 className="text-[15px] font-semibold text-ink">A complete client in twenty lines</h2>
        <p className="mt-2 text-sm text-muted">
          The two things worth getting right are the envelope and the error type. Unwrapping{' '}
          <code className="font-mono text-xs">success</code> before returning means a caller can never
          accidentally read a failed response as data.
        </p>
        <Code>{`// lib/blocksense.ts
export class BlockSenseError extends Error {
  constructor(
    readonly code: string,
    message: string,
    readonly status: number
  ) {
    super(message);
    this.name = 'BlockSenseError';
  }
}

export interface Envelope<T> {
  success: boolean;
  data?: T;
  error?: { code: string; message: string };
  meta?: { requestId: string; timestamp: number };
}

export function createClient(baseUrl = '') {
  async function request<T>(path: string, init?: RequestInit): Promise<T> {
    const res = await fetch(\`\${baseUrl}/api/v1\${path}\`, {
      ...init,
      headers: { accept: 'application/json', ...(init?.headers ?? {}) }
    });
    const body = (await res.json()) as Envelope<T>;
    if (!body.success || body.data === undefined) {
      throw new BlockSenseError(body.error?.code ?? 'UNKNOWN', body.error?.message ?? res.statusText, res.status);
    }
    return body.data;
  }

  return {
    transaction: (chain: string, hash: string) => request<Transaction>(\`/transactions/\${chain}/\${hash}\`),
    wallet: (chain: string, address: string) => request<Wallet>(\`/wallets/\${chain}/\${address}\`),
    history: (chain: string, address: string, limit = 25) =>
      request<Transaction[]>(\`/wallets/\${chain}/\${address}/history?limit=\${limit}\`),
    network: (chain: string, address: string, depth = 2) =>
      request<NetworkGraph>(\`/wallets/\${chain}/\${address}/network?depth=\${depth}\`),
    analyze: (chain: string, hash: string) =>
      request<Analysis>('/analyze', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ chain, hash })
      }),
    health: () => request<Health>('/health')
  };
}`}</Code>
      </section>

      <section>
        <h2 className="text-[15px] font-semibold text-ink">Using it</h2>
        <Code>{`import { createClient } from './lib/blocksense';

const blocksense = createClient('https://your-deployment');

const tx = await blocksense.transaction('tron', '${TRON_EXAMPLE_TX}');

console.log(tx.asset.symbol, tx.asset.amount);
console.log(tx.anomaly.score, tx.anomaly.level, tx.anomaly.confidence);

try {
  await blocksense.wallet('ethereum', '0xnot-an-address');
} catch (err) {
  if (err instanceof BlockSenseError && err.code === 'INVALID_ADDRESS') {
    // the identifier never left the server
  }
}`}</Code>
      </section>

      <section>
        <h2 className="text-[15px] font-semibold text-ink">TypeScript types</h2>
        <p className="mt-2 text-sm text-muted">
          The canonical definitions live in <code className="rounded bg-subtle px-1.5 py-0.5 font-mono text-xs">@blocksense/shared</code>{' '}
          and are the same types the API validates against. Import them from the repository rather than
          re-declaring them, so a schema change is a compile error instead of a runtime surprise.
        </p>
        <Code>{`import type {
  ChainId,
  Transaction,
  Wallet,
  NetworkGraphData,
  AnomalyLevel,
  Confidence
} from '@blocksense/shared';`}</Code>
      </section>

      <section>
        <Panel title="Handle these three cases, and you are done">
          <ul className="space-y-3 text-sm leading-relaxed text-muted">
            <li>
              <span className="font-medium text-ink">Validation errors.</span>{' '}
              <code className="font-mono text-xs">INVALID_ADDRESS</code>,{' '}
              <code className="font-mono text-xs">INVALID_TRANSACTION_HASH</code>,{' '}
              <code className="font-mono text-xs">INVALID_REQUEST</code>. The request never reached a
              chain, and retrying will not help.
            </li>
            <li>
              <span className="font-medium text-ink">Not found.</span>{' '}
              <code className="font-mono text-xs">TRANSACTION_NOT_FOUND</code> is a real answer from the
              chain, not a failure of yours.
            </li>
            <li>
              <span className="font-medium text-ink">Throttling.</span>{' '}
              <code className="font-mono text-xs">RPC_RATE_LIMITED</code> and{' '}
              <code className="font-mono text-xs">RPC_UNAVAILABLE</code> are worth retrying with backoff.
              The API has already retried once internally before reporting them.
            </li>
          </ul>
        </Panel>
      </section>
    </div>
  );
}
