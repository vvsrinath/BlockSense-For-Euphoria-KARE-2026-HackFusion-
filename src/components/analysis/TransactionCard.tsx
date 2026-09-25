import { type ReactNode } from 'react';
import { findWallet } from '../../api/wallets';
import { AddressDisplay } from '../common/AddressDisplay';
import { ChainBadge } from '../common/ChainBadge';
import { InfoTip } from '../common/InfoTip';
import { Panel } from '../common/Panel';
import { useSettings } from '../../contexts/SettingsContext';
import type { Transaction } from '../../types/transaction';
import { formatDateTime, formatMoney, formatNumber } from '../../utils/format';

interface TransactionCardProps {
  tx: Transaction;
  advanced: boolean;
}

function Row({ label, hint, children }: {label: string;hint?: string;children: ReactNode;}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-line py-3 last:border-b-0">
      <dt className="flex items-center gap-1 text-sm text-muted">
        {label}
        {hint && <InfoTip text={hint} />}
      </dt>
      <dd className="min-w-0 text-right text-sm text-ink">{children}</dd>
    </div>);

}

export function TransactionCard({ tx, advanced }: TransactionCardProps) {
  const { settings } = useSettings();
  return (
    <Panel title="Transaction overview" description="Who sent what, where and when">
      <dl>
        {advanced &&
        <Row label="Transaction hash" hint="A unique ID for this transaction on the blockchain.">
            <AddressDisplay value={tx.hash} chain={tx.chain} type="tx" start={8} end={6} />
          </Row>
        }
        <Row label="Status" hint="Confirmed transactions are final and can't be reversed.">
          <span className="inline-flex items-center gap-1.5 font-medium text-success-ink">
            <span className="h-1.5 w-1.5 rounded-full bg-success" aria-hidden="true" />
            {tx.status === 'confirmed' ? 'Confirmed' : tx.status}
            {advanced && <span className="font-normal text-muted">· {formatNumber(tx.confirmations)} confirmations</span>}
          </span>
        </Row>
        <Row label="From" hint="The wallet that sent the asset.">
          <AddressDisplay value={tx.from} chain={tx.chain} to={findWallet(tx.from) ? `/wallet/${tx.from}` : undefined} />
        </Row>
        <Row label="To" hint="The wallet or contract that received it.">
          <AddressDisplay value={tx.to} chain={tx.chain} to={findWallet(tx.to) ? `/wallet/${tx.to}` : undefined} />
        </Row>
        <Row label="Network">
          <ChainBadge chain={tx.chain} className="justify-end" />
        </Row>
        {advanced &&
        <Row label="Block" hint="The block that recorded this transaction.">
            <span className="font-mono text-[13px]">{formatNumber(tx.block)}</span>
          </Row>
        }
        <Row label="Time">{formatDateTime(tx.timestamp, settings.timeFormat)}</Row>
        {tx.fee &&
        <Row label="Network fee" hint="Paid to the network to process the transaction. It does not go to the receiver.">
            {tx.fee.amount} {tx.fee.symbol}
            {tx.fee.valueUsd !== undefined && <span className="text-muted"> ≈ {formatMoney(tx.fee.valueUsd, settings.currency)}</span>}
          </Row>
        }
      </dl>
    </Panel>);

}