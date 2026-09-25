import { OctagonAlertIcon } from 'lucide-react';

interface IllustrationNode {
  x: number;
  y: number;
  label: string;
  tone: 'primary' | 'cyan' | 'orange' | 'purple' | 'danger';
}

const toneFill: Record<IllustrationNode['tone'], string> = {
  primary: 'fill-primary',
  cyan: 'fill-cyan',
  orange: 'fill-orange',
  purple: 'fill-purple',
  danger: 'fill-danger'
};

const assets: IllustrationNode[] = [
{ x: 100, y: 200, label: 'ETH', tone: 'primary' },
{ x: 240, y: 200, label: 'USDC', tone: 'cyan' },
{ x: 380, y: 200, label: 'NFT', tone: 'purple' }];


const destinations: IllustrationNode[] = [
{ x: 100, y: 330, label: 'Exchange', tone: 'orange' },
{ x: 240, y: 330, label: 'DeFi', tone: 'purple' },
{ x: 380, y: 330, label: 'New wallet', tone: 'danger' }];


export function NetworkIllustration() {
  return (
    <div className="relative mx-auto w-full max-w-[520px]">
      <svg viewBox="0 0 480 400" className="h-auto w-full" role="img" aria-label="Illustration: a wallet sends ETH, USDC and an NFT to an exchange, a DeFi protocol and a new wallet">
        <rect x="8" y="8" width="464" height="384" rx="24" className="fill-surface stroke-line" strokeWidth="1" />
        {assets.map((a) =>
        <line key={`w-${a.label}`} x1="240" y1="88" x2={a.x} y2={a.y - 22} className="stroke-line-strong" strokeWidth="1.5" />
        )}
        {assets.map((a, i) =>
        <line
          key={`d-${a.label}`}
          x1={a.x}
          y1={a.y + 22}
          x2={destinations[i].x}
          y2={destinations[i].y - 22}
          className={i === 2 ? 'bs-flow stroke-danger' : 'bs-flow stroke-primary/60'}
          strokeWidth="1.5" />

        )}

        <g>
          <rect x="180" y="44" width="120" height="44" rx="14" className="fill-brand-ink" />
          <text x="240" y="71" textAnchor="middle" className="fill-surface text-[14px] font-semibold">
            Wallet
          </text>
        </g>

        {assets.map((a) =>
        <g key={a.label}>
            <circle cx={a.x} cy={a.y} r="22" className={toneFill[a.tone]} opacity="0.12" />
            <circle cx={a.x} cy={a.y} r="14" className={toneFill[a.tone]} />
            <text x={a.x + 30} y={a.y + 4} className="fill-ink text-[12px] font-semibold">
              {a.label}
            </text>
          </g>
        )}

        {destinations.map((d) =>
        <g key={d.label}>
            <rect x={d.x - 48} y={d.y - 18} width="96" height="36" rx="12" className="fill-bg stroke-line" strokeWidth="1" />
            <circle cx={d.x - 32} cy={d.y} r="4" className={toneFill[d.tone]} />
            <text x={d.x - 22} y={d.y + 4} className="fill-ink text-[12px] font-medium">
              {d.label}
            </text>
          </g>
        )}
      </svg>

      <div className="absolute -right-2 top-[38%] w-[190px] rounded-xl border border-line bg-surface p-3 shadow-pop sm:-right-6">
        <div className="flex items-center justify-between">
          <p className="text-[11px] text-muted">Anomaly score</p>
          <OctagonAlertIcon className="h-3.5 w-3.5 text-danger-ink" aria-hidden="true" />
        </div>
        <p className="mt-0.5 text-xl font-semibold tabular-nums text-ink">
          87 <span className="text-xs font-normal text-muted">/ 100</span>
        </p>
        <p className="mt-1 text-[11px] leading-snug text-muted">Amount 12.5× higher than normal · first interaction</p>
      </div>
    </div>);

}