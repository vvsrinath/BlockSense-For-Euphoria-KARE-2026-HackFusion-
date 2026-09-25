import { CheckIcon, KeyRoundIcon } from 'lucide-react';
import { Panel } from '@blocksense/ui';
import { chains } from '../../data/marketing';
import { CtaBand, PageIntro, Section } from '../../components/public/marketing';

const ENV = [
  { chain: 'Ethereum', vars: ['ETHEREUM_RPC_URL', 'ETHERSCAN_API_KEY'] },
  { chain: 'BNB Chain', vars: ['BNB_RPC_URL', 'BSCSCAN_API_KEY'] },
  { chain: 'TRON', vars: ['TRON_RPC_URL', 'TRON_API_KEY'] },
  { chain: 'Solana', vars: ['SOLANA_RPC_URL', 'SOLANA_API_KEY'] },
  { chain: 'Bitcoin', vars: ['BITCOIN_RPC_URL', 'MEMPOOL_API_KEY'] }
];

/**
 * Supported chains.
 *
 * States plainly which two chains need a credential for history, because
 discovering that mid-investigation is worse than reading it here.
 */
export function Chains() {
  return (
    <>
      <Section>
        <PageIntro
          eyebrow="Supported chains"
          title="Five chains, read live at request time"
          description="Nothing is pre-indexed. When you ask about an address, BlockSense asks a public node and reports what it says — including when the answer is that it cannot help."
        />
      </Section>

      <Section className="pt-0">
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {chains.map((chain) => (
            <Panel key={chain.id}>
              <div className="flex items-center gap-2.5">
                <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${chain.accent}`} aria-hidden="true" />
                <h2 className="text-[15px] font-semibold text-ink">{chain.name}</h2>
                <span className="ml-auto text-xs font-medium text-muted">{chain.nativeSymbol}</span>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-success/15 px-2.5 py-1 text-[11px] font-medium text-success">
                  <CheckIcon className="h-3 w-3" aria-hidden="true" />
                  Transactions
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-success/15 px-2.5 py-1 text-[11px] font-medium text-success">
                  <CheckIcon className="h-3 w-3" aria-hidden="true" />
                  Balances
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-success/15 px-2.5 py-1 text-[11px] font-medium text-success">
                  <CheckIcon className="h-3 w-3" aria-hidden="true" />
                  USD pricing
                </span>
                {chain.history === 'Live' ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-success/15 px-2.5 py-1 text-[11px] font-medium text-success">
                    <CheckIcon className="h-3 w-3" aria-hidden="true" />
                    History
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-warning/15 px-2.5 py-1 text-[11px] font-medium text-warning-ink">
                    <KeyRoundIcon className="h-3 w-3" aria-hidden="true" />
                    History needs a key
                  </span>
                )}
              </div>

              <ul className="mt-4 space-y-2 border-t border-line pt-4">
                {chain.notes.map((note) => (
                  <li key={note} className="text-sm leading-relaxed text-muted">
                    {note}
                  </li>
                ))}
              </ul>
            </Panel>
          ))}
        </div>
      </Section>

      <Section className="pt-0">
        <Panel title="Bring your own provider" description="Every chain works with no configuration. Setting a URL removes the rate limit that comes with sharing a public endpoint.">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[420px] text-left text-sm">
              <thead>
                <tr className="border-b border-line text-xs uppercase tracking-wide text-muted">
                  <th scope="col" className="pb-2 pr-4 font-medium">Chain</th>
                  <th scope="col" className="pb-2 font-medium">Environment variables</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {ENV.map((row) => (
                  <tr key={row.chain}>
                    <th scope="row" className="py-2.5 pr-4 font-medium text-ink">{row.chain}</th>
                    <td className="py-2.5">
                      <code className="font-mono text-xs text-muted">{row.vars.join('  ')}</code>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-4 text-sm leading-relaxed text-muted">
            Run <code className="rounded bg-subtle px-1.5 py-0.5 font-mono text-xs">pnpm check:env</code> to
            see which providers the API resolved when it started.
          </p>
        </Panel>
      </Section>

      <Section className="pt-0">
        <CtaBand
          title="Try any of them"
          description="Paste a transaction hash or a wallet address. The chain is detected when the identifier is unambiguous."
          primary={{ label: 'Analyze', to: '/analyze' }}
          secondary={{ label: 'How it works', to: '/how-it-works' }}
        />
      </Section>
    </>
  );
}
