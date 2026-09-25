import { motion } from 'framer-motion';
import { ArrowRightIcon, EyeOffIcon, GitForkIcon, XIcon } from 'lucide-react';
import { AddressDisplay, Button, LevelBadge } from '@blocksense/ui';

import { useSettings } from '../../stores/SettingsContext';
import { cn, formatMoney, formatMonthYear, formatNumber } from '@blocksense/shared';
import type { ChainId, NetworkEntity } from '@blocksense/shared';
import { nodeKindLabel } from '@blocksense/intelligence';
import { nodeKindStyles } from '@blocksense/ui';

interface NodeDetailsProps {
  entity: NetworkEntity;
  chain: ChainId;
  expanded: boolean;
  isCenter: boolean;
  onClose: () => void;
  onExpand: () => void;
  onHide: () => void;
}

export function NodeDetails({ entity, chain, expanded, isCenter, onClose, onExpand, onHide }: NodeDetailsProps) {
  const { settings } = useSettings();
  const meta = nodeKindStyles[entity.kind];
  const Icon = meta.icon;

  const facts = [
  { label: 'Type', value: nodeKindLabel(entity.kind) },
  { label: 'First seen', value: formatMonthYear(entity.firstSeen) },
  { label: 'Transactions', value: formatNumber(entity.txCount) },
  { label: 'Relationship', value: entity.relationship },
  { label: 'Total transferred', value: formatMoney(entity.totalUsd, settings.currency) }];

  return (
    <motion.aside
      aria-label={`Details for ${entity.label}`}
      initial={{ opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 16 }}
      transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
      className="absolute inset-x-2 bottom-2 z-20 max-h-[72%] overflow-y-auto rounded-2xl border border-line bg-surface p-5 shadow-pop md:inset-x-auto md:bottom-3 md:right-3 md:top-3 md:max-h-none md:w-[300px]">
      
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className={cn('flex h-10 w-10 items-center justify-center rounded-xl', meta.soft)}>
            <Icon className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <p className="text-[15px] font-semibold text-ink">{entity.label}</p>
            <LevelBadge level={entity.level} className="mt-1" />
          </div>
        </div>
        <button type="button" onClick={onClose} aria-label="Close details" className="-mr-1 flex h-8 w-8 items-center justify-center rounded-lg text-muted hover:bg-subtle hover:text-ink">
          <XIcon className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>

      <div className="mt-4">
        <AddressDisplay value={entity.address} chain={chain} />
      </div>

      <dl className="mt-3">
        {facts.map((f) =>
        <div key={f.label} className="flex items-start justify-between gap-3 border-b border-line py-2.5 last:border-b-0">
            <dt className="text-[13px] text-muted">{f.label}</dt>
            <dd className="text-right text-[13px] font-medium text-ink">{f.value}</dd>
          </div>
        )}
      </dl>

      <div className="mt-4 space-y-2">
        <Button to={`/wallet/${encodeURIComponent(entity.address)}`} className="w-full" iconRight={ArrowRightIcon}>
          View analysis
        </Button>
        <div className="grid grid-cols-2 gap-2">
          <Button variant="secondary" size="sm" icon={GitForkIcon} onClick={onExpand} disabled={expanded}>
            {expanded ? 'Expanded' : 'Expand'}
          </Button>
          <Button variant="secondary" size="sm" icon={EyeOffIcon} onClick={onHide} disabled={isCenter}>
            Hide
          </Button>
        </div>
      </div>
    </motion.aside>);

}