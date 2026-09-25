import React from "react";
import { MonitorIcon, MoonIcon, SunIcon, type LucideIcon } from "lucide-react";
import { toast } from "sonner";
import { Button, Panel, Segmented, Toggle } from '@blocksense/ui';

import { PageContainer } from "../components/layout/PageContainer";
import { PageHeader } from "../components/layout/PageHeader";
import { useSettings } from '../stores/SettingsContext';
import { chains } from '@blocksense/blockchain';
import { cn } from '@blocksense/shared';
import type { ChainFilter, Currency, ThemePreference, TimeFormat, ViewMode } from '@blocksense/shared';
const themes: {
  value: ThemePreference;
  label: string;
  icon: LucideIcon;
}[] = [{
  value: 'light',
  label: 'Light',
  icon: SunIcon
}, {
  value: 'dark',
  label: 'Dark',
  icon: MoonIcon
}, {
  value: 'system',
  label: 'System',
  icon: MonitorIcon
}];
const libraries = ['React', 'TypeScript', 'Vite', 'Tailwind CSS', 'React Router', 'Lucide', 'Recharts', 'React Flow', 'Zod', 'Framer Motion', 'Sonner'];
function Field({
  label,
  description,
  children

}: {label: string;description?: string;children: React.ReactNode;}) {
  return <div className="flex flex-col gap-2 border-b border-line py-4 first:pt-0 last:border-b-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-sm font-medium text-ink">{label}</p>
        {description && <p className="mt-0.5 text-[13px] text-muted">{description}</p>}
      </div>
      {children}
    </div>;
}
export function Settings() {
  const {
    settings,
    update,
    reset
  } = useSettings();
  const clearData = () => {
    ['blocksense.watchlist', 'blocksense.reports'].forEach((k) => localStorage.removeItem(k));
    reset();
    toast.success('Local data cleared', {
      description: 'Reloading to restore the demo defaults…'
    });
    setTimeout(() => window.location.reload(), 900);
  };
  return <PageContainer>
      <div className="max-w-3xl">
        <PageHeader title="Settings" description="Preferences are saved in this browser." />
        <div className="space-y-4 lg:space-y-6">
          <Panel title="Appearance">
            <div role="radiogroup" aria-label="Theme" className="grid grid-cols-3 gap-3">
              {themes.map((t) => {
              const active = settings.theme === t.value;
              return <button key={t.value} type="button" role="radio" aria-checked={active} onClick={() => update({
                theme: t.value
              })} className={cn('flex flex-col items-center gap-2 rounded-xl border px-3 py-4 text-sm font-medium transition-colors duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50', active ? 'border-primary/40 bg-primary/[0.06] text-primary' : 'border-line text-ink hover:bg-subtle')}>
                    <t.icon className="h-5 w-5" aria-hidden="true" />
                    {t.label}
                  </button>;
            })}
            </div>
          </Panel>

          <Panel title="Preferences">
            <Field label="Default chain" description="Used as a hint when an address could belong to several chains.">
              <select value={settings.defaultChain} onChange={(e) => update({
              defaultChain: e.target.value as ChainFilter
            })} aria-label="Default chain" className="h-10 rounded-xl border border-line bg-surface px-3 text-sm text-ink focus:border-primary/60 focus:outline-none focus:ring-4 focus:ring-primary/10">
                <option value="all">All chains</option>
                {chains.map((c) => <option key={c.id} value={c.id}>
                    {c.name}
                  </option>)}
              </select>
            </Field>
            <Field label="Default currency">
              <Segmented<Currency> options={[{
              value: 'USD',
              label: 'USD'
            }, {
              value: 'EUR',
              label: 'EUR'
            }]} value={settings.currency} onChange={(v) => update({
              currency: v
            })} label="Currency" size="md" />
            </Field>
            <Field label="Time format" description="All times are shown in UTC.">
              <Segmented<TimeFormat> options={[{
              value: '24h',
              label: '24-hour'
            }, {
              value: '12h',
              label: '12-hour'
            }]} value={settings.timeFormat} onChange={(v) => update({
              timeFormat: v
            })} label="Time format" size="md" />
            </Field>
            <Field label="Detail level" description="Simple view hides raw technical values until you ask for them.">
              <Segmented<ViewMode> options={[{
              value: 'simple',
              label: 'Simple'
            }, {
              value: 'advanced',
              label: 'Advanced'
            }]} value={settings.viewMode} onChange={(v) => update({
              viewMode: v
            })} label="Detail level" size="md" />
            </Field>
          </Panel>

          <Panel title="Privacy & data">
            <div className="space-y-5">
              <Toggle label="Remember recent searches" description="Stored only in this browser." checked={settings.rememberSearches} onChange={(v) => update({
              rememberSearches: v
            })} />
              <Toggle label="Simulate provider outage" description="Preview how BlockSense handles an unavailable data provider." checked={settings.simulateError} onChange={(v) => update({
              simulateError: v
            })} />
              <div className="flex flex-col gap-3 border-t border-line pt-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-medium text-ink">Clear local data</p>
                  <p className="mt-0.5 text-[13px] text-muted">Resets watchlist, generated reports and preferences.</p>
                </div>
                <Button variant="secondary" onClick={clearData}>
                  Clear data
                </Button>
              </div>
            </div>
          </Panel>

          <Panel title="About">
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-muted">BlockSense version</dt>
                <dd className="font-mono text-[13px] text-ink">0.9.0-demo</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted">Data source</dt>
                <dd className="text-right text-ink">Demo dataset · backend not connected</dd>
              </div>
              <div>
                <dt className="text-muted">Open-source libraries</dt>
                <dd className="mt-2 flex flex-wrap gap-1.5">
                  {libraries.map((lib) => <span key={lib} className="rounded-full bg-subtle px-2.5 py-0.5 text-xs text-muted">
                      {lib}
                    </span>)}
                </dd>
              </div>
            </dl>
          </Panel>
        </div>
      </div>
    </PageContainer>;
}