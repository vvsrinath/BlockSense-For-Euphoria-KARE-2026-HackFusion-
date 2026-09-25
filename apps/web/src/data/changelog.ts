/**
 * Release history.
 *
 * Written as what changed and why, not as a list of file names. Entries name
 * the user-visible consequence, because that is what a changelog is for.
 */

export interface ChangelogEntry {
  version: string;
  date: string;
  summary: string;
  changes: { area: string; text: string }[];
}

export const changelog: ChangelogEntry[] = [
  {
    version: '0.5.0',
    date: '2026-09-26',
    summary: 'Public site, documentation, and a status page built on live health data.',
    changes: [
      { area: 'Public site', text: 'Marketing pages for features, how it works, chains, use cases, pricing, about, roadmap, security, scope, and contact.' },
      { area: 'Scope', text: 'An explicit page for what the product cannot do. A tool that scores addresses is one sentence away from being read as an accusation engine, and the boundary is now part of the product.' },
      { area: 'Pricing', text: 'Four tiers with no prices beyond the free one, because the commercial model is not decided. A published number is a commitment, and a wrong one is hard to walk back.' },
      { area: 'Status', text: 'A health page that polls the same endpoints the product uses, and reports "API unreachable" rather than optimistic green rows when it cannot reach them.' },
      { area: 'Docs', text: 'Developer hub, API reference generated from the running route table, SDK guide, architecture, and a contributing guide.' }
    ]
  },
  {
    version: '0.4.0',
    date: '2026-09-26',
    summary: 'Single-origin deployment on Netlify, and a provider throttle no longer looks like a broken product.',
    changes: [
      { area: 'Deployment', text: 'The API runs as a Netlify Function on the same origin as the app, so no second host and no VITE_API_BASE_URL is needed.' },
      { area: 'Routing', text: 'The /api/* redirect is forced and ordered before the SPA catch-all; otherwise /api/v1/health is served index.html and the client renders HTML where it expects JSON.' },
      { area: 'Resilience', text: 'A recently expired cache entry is served when a provider fails, rather than replacing a real answer with an error. Rate limits are retried with jittered backoff and Retry-After is obeyed.' },
      { area: 'Frontend', text: 'Retryable failures are retried automatically before anything is shown, and error copy distinguishes a rate limit from a missing transaction from a bad identifier.' },
      { area: 'SDK', text: 'Documents a typed client, and the package build now produces a self-contained API bundle.' }
    ]
  },
  {
    version: '0.3.0',
    date: '2026-09-25',
    summary: 'EVM address history, USD pricing, and a fix for TRON token names.',
    changes: [
      { area: 'Pricing', text: 'Assets are priced from DefiLlama. A token the provider does not list keeps no value at all rather than being given a zero, because a fake zero drags every average down.' },
      { area: 'Ethereum and BNB', text: 'Address history from Etherscan, and keyless native balances. Without a key, history returns NOT_IMPLEMENTED naming the variable rather than an empty timeline.' },
      { area: 'TRON', text: 'Token names had never worked. Constant calls sent a method name where the node expects a raw selector, and the string decoder read its length at a byte offset without doubling it. Every token rendered as a placeholder.' },
      { area: 'Solana', text: 'Transactions are described by what they did. "0 SOL transferred" was being reported for mints and accounts being created, which is true and uninformative.' }
    ]
  },
  {
    version: '0.2.0',
    date: '2026-09-25',
    summary: 'Live data everywhere, an elevated severity band, and analysis confidence.',
    changes: [
      { area: 'Data', text: 'Every service reads the API instead of a bundled fixture set, and the mock directory is deleted. Seeded content in a risk tool looks like real findings about real wallets.' },
      { area: 'Severity', text: 'Added an elevated band, so unusual is 30–59, elevated is 60–79, and high is 80–100. The UI legend is derived from the thresholds so it cannot disagree with the scorer.' },
      { area: 'Confidence', text: 'Scores now carry a separate confidence based on how many independent signal kinds agreed. Three amount signals are one opinion, not three.' },
      { area: 'Honesty', text: 'With no wallet baseline the product says there is not enough history to compare against, rather than reporting a confident zero.' },
      { area: 'Branding', text: 'Real logo, favicon, and social card, replacing a hand-drawn placeholder with no favicon at all.' }
    ]
  }
];
