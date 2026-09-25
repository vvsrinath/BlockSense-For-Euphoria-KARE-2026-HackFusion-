import { Link, useParams } from 'react-router-dom';
import { NetworkIcon, SearchXIcon, WalletIcon } from 'lucide-react';
import { listKnownWallets, getWallet } from '../services/wallets';
import { BehaviorChart } from '../components/analysis/BehaviorChart';
import { Button, EmptyState, ErrorState, LoadingState } from '@blocksense/ui';

import { PageContainer } from '../components/layout/PageContainer';
import { PageHeader } from '../components/layout/PageHeader';
import { SearchBox } from '../components/search/SearchBox';
import { BehaviorDNA } from '../components/wallet/BehaviorDNA';
import { WalletActivity } from '../components/wallet/WalletActivity';
import { WalletSummary } from '../components/wallet/WalletSummary';
import { WatchButton } from '../components/watchlist/WatchButton';
import { useAsync } from '../hooks/useAsync';
import { useProgressiveLoad } from '../hooks/useProgressiveLoad';
import { getChain, detectInput } from '@blocksense/blockchain';

import { truncateMiddle } from '@blocksense/shared';
import type { Wallet } from '@blocksense/shared';

const STEPS = ['Wallet found', 'Transaction history loaded', 'Behavior profile built', 'Relationships mapped'];

/** Wallets this browser has already opened, so the empty state is not a dead end. */
function KnownWallets() {
  const known = useAsync(listKnownWallets, 'known-wallets');
  if (!known.data || known.data.length === 0) return null;
  return <ExampleWallets wallets={known.data} />;
}

function ExampleWallets({ wallets }: { wallets: Wallet[] }) {
  return (
    <div className="flex flex-wrap justify-center gap-2">
      {wallets.
      slice(0, 4).
      map((w) =>
      <Link
        key={w.address}
        to={`/wallet/${w.address}`}
        className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-1.5 text-[13px] text-ink hover:border-primary/40 hover:bg-primary/[0.06]">
        
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: getChain(w.chain).color }} aria-hidden="true" />
            <span className="font-mono">{truncateMiddle(w.address)}</span>
          </Link>
      )}
    </div>);

}

function WalletView({ address }: {address: string;}) {
  const load = useProgressiveLoad(() => getWallet(address), `wallet:${address}`, STEPS.length);

  if (load.status === 'loading') return <LoadingState title="Analyzing wallet…" steps={STEPS} current={load.step} />;
  if (load.status === 'error') return <ErrorState error={load.error} onRetry={load.retry} />;

  if (!load.data) {
    const isAddress = detectInput(address).kind === 'address';
    return (
      <EmptyState
        icon={SearchXIcon}
        title={isAddress ? "We couldn't build a profile for this wallet" : "We couldn't identify this input."}
        description={
          isAddress
            ? 'The address is valid, but its chain returned no activity. It may be a contract, or an address that has never transacted.'
            : 'Check the address and try again.'
        }
      >
        <KnownWallets />
      </EmptyState>);

  }

  const wallet = load.data;
  return (
    <>
      <PageHeader
        back={{ to: '/wallet', label: 'Wallet analysis' }}
        title="Wallet analysis"
        description={`Observed behavior on ${getChain(wallet.chain).name}`}
        actions={
        <>
            <WatchButton kind="wallet" value={wallet.address} chain={wallet.chain} status={wallet.status} label={wallet.label} />
            <Button to={`/network?address=${encodeURIComponent(wallet.address)}`} icon={NetworkIcon}>
              View network
            </Button>
          </>
        } />
      
      <div className="space-y-4 lg:space-y-6">
        <WalletSummary wallet={wallet} />
        <BehaviorDNA wallet={wallet} />
        <BehaviorChart address={wallet.address} description="Incoming vs outgoing activity for this wallet" />
        <WalletActivity wallet={wallet} />
      </div>
    </>);

}

export function WalletAnalysis() {
  const { address } = useParams();

  return (
    <PageContainer>
      {address ?
      <WalletView key={address} address={address} /> :

      <>
          <PageHeader title="Wallet analysis" description="Understand how a wallet usually behaves — and what has changed." />
          <EmptyState icon={WalletIcon} title="No wallet selected" description="Search for a wallet address to begin analysis.">
            <SearchBox size="lg" placeholder="Enter wallet address" autoFocus />
            <p className="mb-3 mt-6 text-sm text-muted">Or reopen a wallet you have viewed</p>
            <KnownWallets />
          </EmptyState>
        </>
      }
    </PageContainer>);

}