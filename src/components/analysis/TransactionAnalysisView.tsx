import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileTextIcon, NetworkIcon, WalletIcon } from 'lucide-react';
import { toast } from 'sonner';
import { generateReportForTransaction } from '../../api/reports';
import { findWallet } from '../../api/wallets';
import { AssetCard } from './AssetCard';
import { BehaviorChart } from './BehaviorChart';
import { BehaviorSignals } from './BehaviorSignals';
import { RelatedWallets } from './RelatedWallets';
import { RiskScore } from './RiskScore';
import { TechnicalDetails } from './TechnicalDetails';
import { TransactionCard } from './TransactionCard';
import { TransactionHero } from './TransactionHero';
import { Button } from '../common/Button';
import { EmptyState } from '../common/EmptyState';
import { Panel } from '../common/Panel';
import { Segmented } from '../common/Segmented';
import { PageContainer } from '../layout/PageContainer';
import { PageHeader } from '../layout/PageHeader';
import { WatchButton } from '../watchlist/WatchButton';
import { useSettings } from '../../contexts/SettingsContext';
import type { Transaction } from '../../types/transaction';
import type { ViewMode } from '../../types/settings';
import { formatNumber, truncateMiddle } from '../../utils/format';

const viewOptions: {value: ViewMode;label: string;}[] = [
{ value: 'simple', label: 'Simple view' },
{ value: 'advanced', label: 'Advanced' }];


export function TransactionAnalysisView({ tx }: {tx: Transaction;}) {
  const { settings, update } = useSettings();
  const navigate = useNavigate();
  const [generating, setGenerating] = useState(false);
  const advanced = settings.viewMode === 'advanced';
  const focusAddress = findWallet(tx.from) ? tx.from : findWallet(tx.to) ? tx.to : undefined;

  const technical = [
  ...tx.technical,
  { label: 'Transaction hash', value: tx.hash },
  { label: 'Block', value: formatNumber(tx.block) },
  ...(tx.asset.standard ? [{ label: 'Token standard', value: tx.asset.standard }] : []),
  ...(tx.asset.decimals !== undefined ? [{ label: 'Decimals', value: String(tx.asset.decimals) }] : [])];


  const handleReport = async () => {
    setGenerating(true);
    try {
      const id = await generateReportForTransaction(tx.hash);
      toast.success('Investigation report ready');
      navigate(`/reports/${id}`);
    } catch {
      toast.error("We couldn't generate the report right now. Try again.");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <PageContainer>
      <PageHeader
        back={{ to: '/analyze', label: 'Analyze' }}
        title="Transaction analysis"
        description={
        <>
            <span className="font-mono">{truncateMiddle(tx.hash, 10, 8)}</span>
            <span className="mx-2 text-line-strong">·</span>
            {tx.isDemo ? 'Demo transaction' : 'Sample data'}
          </>
        }
        actions={
        <>
            <Segmented options={viewOptions} value={settings.viewMode} onChange={(v) => update({ viewMode: v })} label="Detail level" size="md" />
            <WatchButton kind="transaction" value={tx.hash} chain={tx.chain} status={tx.anomaly?.level ?? 'normal'} label={`${tx.asset.symbol} transfer`} />
            <Button onClick={handleReport} icon={FileTextIcon} disabled={generating}>
              {generating ? 'Generating…' : 'Generate report'}
            </Button>
          </>
        } />
      

      <div className="grid gap-4 lg:grid-cols-3 lg:gap-6">
        <TransactionHero tx={tx} className="lg:col-span-2" />
        {tx.anomaly && <RiskScore anomaly={tx.anomaly} />}
      </div>

      <div className="mt-4 grid gap-4 lg:mt-6 lg:grid-cols-2 lg:gap-6">
        <TransactionCard tx={tx} advanced={advanced} />
        <AssetCard tx={tx} advanced={advanced} />
      </div>

      {tx.anomaly && <BehaviorSignals signals={tx.anomaly.details} className="mt-4 lg:mt-6" />}

      <div className="mt-4 grid gap-4 lg:mt-6 lg:gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2">
          {focusAddress ?
          <BehaviorChart
            address={focusAddress}
            title={focusAddress === tx.from ? 'Sender behavior over time' : 'Receiver behavior over time'}
            description={`Incoming vs outgoing for ${truncateMiddle(focusAddress)}`} /> :


          <Panel title="Behavior over time">
              <EmptyState icon={WalletIcon} title="Limited wallet history" description="Neither wallet has enough history in the demo dataset to chart behavior." className="py-6" />
            </Panel>
          }
        </div>
        <RelatedWallets related={tx.related} chain={tx.chain} networkAddress={focusAddress} />
      </div>

      <TechnicalDetails key={settings.viewMode} fields={technical} defaultOpen={advanced} className="mt-4 lg:mt-6" />

      <section aria-label="Next steps" className="mt-6 flex flex-col gap-4 rounded-2xl bg-primary/[0.06] p-5 md:flex-row md:items-center md:justify-between md:p-6">
        <div>
          <p className="text-[15px] font-semibold text-ink">Continue the investigation</p>
          <p className="mt-0.5 text-sm text-muted">Look at the wallets involved, their network, or save a report.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {focusAddress &&
          <>
              <Button to={`/wallet/${focusAddress}`} variant="secondary" icon={WalletIcon}>
                View wallet
              </Button>
              <Button to={`/network?address=${encodeURIComponent(focusAddress)}`} variant="secondary" icon={NetworkIcon}>
                View network
              </Button>
            </>
          }
          <Button onClick={handleReport} icon={FileTextIcon} disabled={generating}>
            Generate report
          </Button>
        </div>
      </section>
    </PageContainer>);

}