/**
 * Public page content.
 *
 * Copy lives here rather than inside the components so the same claims can be
 * reused across pages, and reviewed in one place.
 *
 * Two rules govern everything in this file:
 *
 * 1. No claim outruns the product. Every "cannot" on the Scope page is a real
 *    limit, and the pricing page deliberately carries no prices.
 * 2. No invented facts. Chain support, variable names, and route shapes all
 *    come from the code rather than from aspiration.
 */

import type { LucideIcon } from 'lucide-react';
import {
  ActivityIcon,
  BlocksIcon,
  BracesIcon,
  Building2Icon,
  ClockIcon,
  CoinsIcon,
  DatabaseIcon,
  EyeIcon,
  FileSearchIcon,
  FingerprintIcon,
  GaugeIcon,
  GraduationCapIcon,
  KeyRoundIcon,
  NetworkIcon,
  ScaleIcon,
  ScrollTextIcon,
  ShieldCheckIcon,
  SirenIcon,
  WalletIcon,
  WorkflowIcon
} from 'lucide-react';

/* ------------------------------------------------------------------ pipeline */

/**
 * The analysis pipeline, in the order data actually flows.
 *
 * Each step carries its own caveat, because that is what makes the chain
 * understandable rather than a diagram.
 */
export const pipeline: { stage: string; produces: string; note: string; icon: LucideIcon }[] = [
  {
    stage: 'Blockchain',
    produces: 'Raw blocks and transactions',
    note: 'Read live from a public node. No index of our own, so nothing about you is stored.',
    icon: BlocksIcon
  },
  {
    stage: 'Transaction',
    produces: 'A resolved transaction',
    note: 'Sender, recipient, status, block, and fee. Unconfirmed transactions are labelled as such.',
    icon: ScrollTextIcon
  },
  {
    stage: 'Asset + Amount',
    produces: 'What moved, and how much',
    note: 'Token scale and ticker come from the chain or a price feed, never guessed from a contract address.',
    icon: CoinsIcon
  },
  {
    stage: 'Wallet History',
    produces: 'A behavioural baseline',
    note: 'The most important input. Without it, only signals needing no history can fire.',
    icon: ClockIcon
  },
  {
    stage: 'Behaviour',
    produces: 'Amounts, cadence, counterparties, assets',
    note: 'Typical size, how often the wallet acts, and who it usually transacts with.',
    icon: ActivityIcon
  },
  {
    stage: 'Relationships',
    produces: 'Observed counterparties',
    note: 'Addresses this wallet has actually transacted with. A link is not a relationship between people.',
    icon: FileSearchIcon
  },
  {
    stage: 'Network',
    produces: 'A one-hop graph around the wallet',
    note: 'Direct counterparties today. Deeper expansion is accepted and capped, not yet walked.',
    icon: NetworkIcon
  },
  {
    stage: 'Anomaly',
    produces: 'A 0–100 score, a level, and a confidence',
    note: 'A weighted blend of independent signals, with confidence from how much evidence agreed.',
    icon: GaugeIcon
  },
  {
    stage: 'Explanation',
    produces: 'Plain-language findings',
    note: 'What differed, by how much, against what history. Never a claim about intent.',
    icon: WorkflowIcon
  }
];

/* --------------------------------------------------------------------- scope */

/** What BlockSense is built to do. */
export const canDo: string[] = [
  'Analyse observable on-chain activity on the five supported chains, read live from public infrastructure.',
  'Score a transaction against the behaviour of the wallet that signed it.',
  "Summarise a wallet's history: typical transfer sizes, cadence, active hours, and observed counterparties.",
  'Price supported assets in USD, and leave an unpriced asset explicitly unpriced rather than estimating.',
  'Explain, in plain language, which signals differed from that wallet’s own past behaviour.',
  'Expose all of the above over a documented HTTP API.'
];

/**
 * What it cannot do.
 *
 * The most important content in the product. A tool that scores addresses can be
 * read as an accusation engine, and every item here is a promise not to make
 * one.
 */
export const cannotDo: string[] = [
  'Prove that any activity is criminal. A score is a difference from a baseline, not a finding of fact.',
  'Reveal information that was intentionally hidden. If it is not on-chain, it is not visible here.',
  'Identify a person from an address with certainty. An address is a pseudonym, and clustering is inference.',
  'Guarantee anomaly detection accuracy. Signals are heuristics over observed history, and a normal wallet can look unusual.',
  'Guarantee unlimited historical access. Coverage depends on the public node or indexer answering, and on its limits.',
  'Read private data of any kind. BlockSense never asks for a seed phrase, private key, or signing authority.',
  'Recover, reverse, or move funds. It reads the public ledger; it cannot act on it.'
];

/* ------------------------------------------------------------------- pricing */

export interface PlanFeature {
  label: string;
  included: boolean;
  note?: string;
}

export interface Plan {
  name: string;
  audience: string;
  summary: string;
  highlight?: boolean;
  /** Deliberately no number: the commercial model is not decided. */
  priceLabel: string;
  priceNote: string;
  features: PlanFeature[];
  cta: { label: string; to: string };
}

export const plans: Plan[] = [
  {
    name: 'Free',
    audience: 'For anyone evaluating BlockSense',
    summary: 'Enough to answer a real question about a real transaction.',
    priceLabel: '$0',
    priceNote: 'Free, no card. Rate limits apply.',
    features: [
      { label: 'Basic wallet analysis', included: true },
      { label: 'Basic transaction analysis', included: true },
      { label: 'Network graph, one hop', included: true },
      { label: 'Limited monthly analyses', included: true, note: 'A shared public endpoint caps throughput' },
      { label: 'Reports', included: false, note: 'Reports are held in memory only for now' },
      { label: 'Alerts and webhooks', included: false }
    ],
    cta: { label: 'Start exploring', to: '/analyze' }
  },
  {
    name: 'Developer',
    audience: 'For developers and small projects',
    summary: 'The API, with the limits lifted enough to build on.',
    highlight: true,
    priceLabel: 'To be announced',
    priceNote: 'Pricing is not settled. Get in touch to be told first.',
    features: [
      { label: 'API access', included: true },
      { label: 'Higher rate limits', included: true },
      { label: 'Webhook support', included: true, note: 'Planned; alerts are not built yet' },
      { label: 'Developer documentation and SDK', included: true },
      { label: 'Team seats', included: false }
    ],
    cta: { label: 'Read the API docs', to: '/docs/api' }
  },
  {
    name: 'Business',
    audience: 'For organisations',
    summary: 'Monitoring and reporting across many wallets.',
    priceLabel: 'To be announced',
    priceNote: 'Priced on volume and retention, once the model is decided.',
    features: [
      { label: 'Advanced analysis', included: true },
      { label: 'Higher API limits', included: true },
      { label: 'Reports', included: true },
      { label: 'Alerts', included: true, note: 'Planned' },
      { label: 'Team features', included: true, note: 'Planned' },
      { label: 'Private deployment', included: false }
    ],
    cta: { label: 'Talk to us', to: '/contact' }
  },
  {
    name: 'Enterprise',
    audience: 'Custom',
    summary: 'Your infrastructure, your limits, your requirements.',
    priceLabel: 'Custom',
    priceNote: 'Scoped per deployment.',
    features: [
      { label: 'Dedicated infrastructure', included: true },
      { label: 'Custom limits', included: true },
      { label: 'Private deployment', included: true },
      { label: 'Advanced integrations', included: true },
      { label: 'Support', included: true }
    ],
    cta: { label: 'Contact us', to: '/contact' }
  }
];

/* ------------------------------------------------------------------ use cases */

export interface UseCase {
  title: string;
  problem: string;
  how: string;
  icon: LucideIcon;
}

export const useCases: UseCase[] = [
  {
    title: 'Crypto Compliance',
    problem: 'A desk needs a defensible view of where funds moved without building an indexer.',
    how: "Watch the wallets that matter, and read each one against its own history rather than a static rulebook.",
    icon: ScaleIcon
  },
  {
    title: 'Blockchain Security',
    problem: 'An incident responder has a transaction and needs context, not a decoded blob.',
    how: 'Follow the movement outward to its counterparties and notice when a pattern stops resembling the past.',
    icon: ShieldCheckIcon
  },
  {
    title: 'Web3 Investigations',
    problem: 'An analyst has an address and needs to know what it has actually been doing.',
    how: 'A behavioural profile answers it in one view: sizes, cadence, counterparties, and the assets involved.',
    icon: FileSearchIcon
  },
  {
    title: 'Transaction Monitoring',
    problem: 'A transfer looks unusual and nobody can say why.',
    how: 'A score with a stated confidence, and a plain-language account of which signal fired.',
    icon: SirenIcon
  },
  {
    title: 'Wallet Intelligence',
    problem: 'Counterparty risk needs a read on an address before committing to it.',
    how: 'History-derived behaviour, plus how this wallet relates to the ones it transacts with.',
    icon: WalletIcon
  },
  {
    title: 'DeFi Monitoring',
    problem: 'A position moved and the protocol context matters as much as the transfer.',
    how: 'Token metadata, priced amounts, and the relationship graph around the interacting addresses.',
    icon: Building2Icon
  },
  {
    title: 'Research',
    problem: 'A study needs consistent, reproducible behavioural data rather than screenshots.',
    how: 'A documented API and a typed SDK, so the same query returns the same shape every time.',
    icon: GraduationCapIcon
  },
  {
    title: 'Developer Tools',
    problem: 'A product needs wallet context without paying for a full indexer.',
    how: 'One HTTP call for a profile, a transaction, or a graph, with no key required to start.',
    icon: BracesIcon
  }
];

/* ------------------------------------------------------------------- roadmap */

export interface Phase {
  name: string;
  status: 'Shipped' | 'In progress' | 'Planned';
  summary: string;
  items: string[];
}

export const roadmap: Phase[] = [
  {
    name: 'Phase 1 — Hackathon MVP',
    status: 'Shipped',
    summary: 'Live multi-chain analysis with no mock data anywhere in normal operation.',
    items: [
      'Five chains read live: Ethereum, BNB Chain, TRON, Solana, Bitcoin',
      'Transaction lookup, wallet profiles, and a one-hop network graph',
      'Anomaly scoring with four levels and a separate confidence',
      'USD pricing, with unpriced assets left explicitly unpriced',
      'A documented API deployed alongside the app on one origin'
    ]
  },
  {
    name: 'Phase 2 — Public Explorer',
    status: 'In progress',
    summary: 'Turn a working tool into a public one people can rely on.',
    items: [
      'Durable storage so reports survive a restart',
      'Ethereum and BNB address history via an explorer index',
      'Alerting on watchlist wallets',
      'Graph expansion beyond direct counterparties'
    ]
  },
  {
    name: 'Phase 3 — Developer API',
    status: 'Planned',
    summary: 'Make it comfortable to build on.',
    items: ['API keys and per-key limits', 'Webhooks for alerts', 'Published SDK with typed responses', 'Stable versioning guarantees']
  },
  {
    name: 'Phase 4 — Business Platform',
    status: 'Planned',
    summary: 'Monitoring for organisations.',
    items: ['Team workspaces and shared watchlists', 'Scheduled reports and exports', 'Case management for flagged wallets', 'Self-serve billing']
  },
  {
    name: 'Phase 5 — Enterprise Intelligence',
    status: 'Planned',
    summary: 'Deployment and integration on the customer’s terms.',
    items: ['Private deployment and dedicated infrastructure', 'Custom retention and data residency', 'Entity clustering with documented confidence', 'Integrations with case and data platforms']
  }
];

/* ------------------------------------------------------------------ security */

export interface SecurityPoint {
  title: string;
  body: string;
  icon: LucideIcon;
}

/** Properties that are true of the code, not aspirations. */
export const securityModel: SecurityPoint[] = [
  {
    title: 'Read-only by construction',
    body: 'The product is an HTTP listener that answers queries. There is no code path that builds, signs, or broadcasts a transaction, and no wallet or key handling anywhere in the repository.',
    icon: EyeIcon
  },
  {
    title: 'No keys, no phrases, ever',
    body: 'BlockSense never asks for a seed phrase or private key. There is nothing to leak because nothing of that kind is ever accepted, stored, or transmitted.',
    icon: KeyRoundIcon
  },
  {
    title: 'Nothing about you is stored',
    body: 'There is no database and no account system. Cache entries live in the memory of one process and are lost on restart. Your watchlist lives in your own browser.',
    icon: DatabaseIcon
  },
  {
    title: 'Rate limited and time boxed',
    body: 'Every request is rate limited per client and every outbound provider call has a timeout, so a slow or hostile upstream cannot hold a connection open indefinitely.',
    icon: ClockIcon
  },
  {
    title: 'Security headers on every response',
    body: 'A restrictive header set, a JSON-only body parser with a size cap, and a route table that rejects the wrong verb on a known path.',
    icon: ShieldCheckIcon
  },
  {
    title: 'Inputs validated, never guessed',
    body: 'Addresses and hashes are checked against their chain’s format before a request is made. A shortened identifier is rejected rather than completed, because guessing an address is how the wrong wallet gets analysed.',
    icon: FingerprintIcon
  }
];

/** Honest disclosure of what a user should still be careful about. */
export const securityLimits: string[] = [
  'Traffic between your browser and the API is only as private as the transport in use. Serve the site over HTTPS.',
  'A shared API key or a shared public endpoint can be throttled by other users of it.',
  'An anomaly score is a statistical signal, not a security control. Do not wire it to an automated block without review.',
  'No address in this product is a verified identity. Treat every label as an assumption.'
];

/* -------------------------------------------------------------------- chains */

export interface ChainInfo {
  id: string;
  name: string;
  nativeSymbol: string;
  /** Whether address history works without any credential. */
  history: 'Live' | 'Needs a key';
  pricing: boolean;
  accent: string;
  notes: string[];
}

/**
 * Per-chain support.
 *
 * Written from what the adapters actually do. `history: 'Needs a key'` is not
 * a plan to fix: `eth_getLogs` cannot answer "everything this address ever
 * did", so those two chains read history from an explorer and say so when no key
 * is configured.
 */
export const chains: ChainInfo[] = [
  {
    id: 'ethereum',
    name: 'Ethereum',
    nativeSymbol: 'ETH',
    history: 'Needs a key',
    pricing: true,
    accent: 'bg-purple',
    notes: [
      'Transactions, balances, and single-transaction token detail from a public node.',
      'Address history needs ETHERSCAN_API_KEY. Without one the route returns NOT_IMPLEMENTED naming the variable, rather than an empty timeline that would read as “this wallet never transacted”.'
    ]
  },
  {
    id: 'bnb',
    name: 'BNB Chain',
    nativeSymbol: 'BNB',
    history: 'Needs a key',
    pricing: true,
    accent: 'bg-warning',
    notes: [
      'The same adapter as Ethereum, pointed at BNB Chain, with its own explorer key.',
      'Balances need no key at all.'
    ]
  },
  {
    id: 'tron',
    name: 'TRON',
    nativeSymbol: 'TRX',
    history: 'Live',
    pricing: true,
    accent: 'bg-danger',
    notes: [
      'Full history from the node, with TRC-20 token names and scales read from the token contracts themselves rather than guessed from the address.',
      'Token metadata calls are retried, because an unanswered decimals() would scale every amount wrongly.'
    ]
  },
  {
    id: 'solana',
    name: 'Solana',
    nativeSymbol: 'SOL',
    history: 'Live',
    pricing: true,
    accent: 'bg-cyan',
    notes: [
      'History and SPL token transfers, with each transaction described by what it actually did — a transfer, a mint creation, or no value movement.',
      'The public endpoint caps requests per IP and is the first of the five to refuse a lookup, so set SOLANA_RPC_URL for reliability.'
    ]
  },
  {
    id: 'bitcoin',
    name: 'Bitcoin',
    nativeSymbol: 'BTC',
    history: 'Live',
    pricing: true,
    accent: 'bg-orange',
    notes: [
      'Confirmed transaction history for any address, priced in USD.',
      'Unconfirmed transactions are labelled as pending rather than presented as final.'
    ]
  }
];
