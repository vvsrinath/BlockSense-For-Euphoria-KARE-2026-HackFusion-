import { useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import { findTransaction } from '../../api/transactions';
import { findWallet } from '../../api/wallets';
import { Button } from '../common/Button';
import { Modal } from '../common/Modal';
import { Segmented } from '../common/Segmented';
import { useWatchlist } from '../../contexts/WatchlistContext';
import type { ChainId } from '../../types/chain';
import { WatchItemInputSchema } from '../../types/schemas';
import type { WatchKind } from '../../types/watchlist';
import { detectInput } from '../../utils/detectInput';

interface AddWatchlistModalProps {
  open: boolean;
  onClose: () => void;
}

const kindOptions: {value: WatchKind;label: string;}[] = [
{ value: 'wallet', label: 'Wallet' },
{ value: 'transaction', label: 'Transaction' },
{ value: 'contract', label: 'Contract' },
{ value: 'token', label: 'Token' }];


export function AddWatchlistModal({ open, onClose }: AddWatchlistModalProps) {
  const { add, find } = useWatchlist();
  const [kind, setKind] = useState<WatchKind>('wallet');
  const [value, setValue] = useState('');
  const [label, setLabel] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleClose = () => {
    setValue('');
    setLabel('');
    setError(null);
    onClose();
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const parsed = WatchItemInputSchema.safeParse({ kind, value, label: label || undefined });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Check the value and try again.');
      return;
    }
    const detection = detectInput(parsed.data.value);
    const expectsTx = kind === 'transaction';
    if (detection.kind !== (expectsTx ? 'transaction' : 'address')) {
      setError(expectsTx ? "This doesn't look like a transaction hash." : "This doesn't look like an address.");
      return;
    }
    if (find(parsed.data.value)) {
      setError('This item is already on your watchlist.');
      return;
    }
    const chain: ChainId = detection.chains[0] ?? 'ethereum';
    const status = expectsTx ? findTransaction(parsed.data.value)?.anomaly?.level ?? 'normal' : findWallet(parsed.data.value)?.status ?? 'normal';
    add({ kind, value: parsed.data.value, chain, status, label: parsed.data.label });
    toast.success('Added to watchlist');
    handleClose();
  };

  return (
    <Modal open={open} onClose={handleClose} title="Add to watchlist" description="Get a quick status for wallets, transactions, contracts and tokens you care about.">
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div>
          <p className="mb-1.5 text-sm font-medium text-ink">Type</p>
          <Segmented options={kindOptions} value={kind} onChange={setKind} label="Item type" size="md" />
        </div>
        <div>
          <label htmlFor="watch-value" className="mb-1.5 block text-sm font-medium text-ink">
            {kind === 'transaction' ? 'Transaction hash' : 'Address'}
          </label>
          <input
            id="watch-value"
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              setError(null);
            }}
            placeholder={kind === 'transaction' ? '0x… or 64-character hash' : '0x…, bc1…, T… or Solana address'}
            spellCheck={false}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? 'watch-error' : undefined}
            className="h-11 w-full rounded-xl border border-line bg-surface px-3 font-mono text-sm text-ink placeholder:font-sans placeholder:text-muted/80 focus:border-primary/60 focus:outline-none focus:ring-4 focus:ring-primary/10" />
          
        </div>
        <div>
          <label htmlFor="watch-label" className="mb-1.5 block text-sm font-medium text-ink">
            Label <span className="font-normal text-muted">(optional)</span>
          </label>
          <input
            id="watch-label"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="e.g. Treasury wallet"
            className="h-11 w-full rounded-xl border border-line bg-surface px-3 text-sm text-ink placeholder:text-muted/80 focus:border-primary/60 focus:outline-none focus:ring-4 focus:ring-primary/10" />
          
        </div>
        {error &&
        <p id="watch-error" role="alert" className="text-sm text-danger-ink">
            {error}
          </p>
        }
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button type="submit">Add to watchlist</Button>
        </div>
      </form>
    </Modal>);

}