import {
  ActivityIcon,
  BookOpenIcon,
  BoxesIcon,
  CodeIcon,
  CoinsIcon,
  GitBranchIcon,
  GithubIcon,
  LayersIcon,
  LinkedinIcon,
  MailIcon,
  NetworkIcon,
  ScrollTextIcon,
  SparklesIcon,
  TargetIcon,
  WorkflowIcon,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

/**
 * Site structure: public navigation, footer, and the developer hub.
 *
 * Kept as data rather than markup so the header, footer, mobile menu, and the
 * docs sidebar cannot drift apart. Every entry is a real route in the app.
 */


export interface SiteLink {
  label: string;
  to: string;
  icon?: LucideIcon;
}

/** Primary navigation shown in the public header. */
export const publicNav: SiteLink[] = [
  { label: 'Features', to: '/features', icon: SparklesIcon },
  { label: 'How it works', to: '/how-it-works', icon: WorkflowIcon },
  { label: 'Chains', to: '/chains', icon: NetworkIcon },
  { label: 'Use cases', to: '/use-cases', icon: TargetIcon },
  { label: 'Pricing', to: '/pricing', icon: CoinsIcon },
  { label: 'Docs', to: '/docs', icon: BookOpenIcon }
];

/** Header links to the right of the primary navigation. */
export const publicNavSecondary: SiteLink[] = [
  { label: 'Status', to: '/status', icon: ActivityIcon },
  { label: 'Sign in', to: '/home' }
];

export interface FooterColumn {
  title: string;
  links: SiteLink[];
}

export const footerColumns: FooterColumn[] = [
  {
    title: 'Product',
    links: [
      { label: 'Features', to: '/features' },
      { label: 'How it works', to: '/how-it-works' },
      { label: 'Supported chains', to: '/chains' },
      { label: 'Use cases', to: '/use-cases' },
      { label: 'Pricing', to: '/pricing' },
      { label: 'System status', to: '/status' }
    ]
  },
  {
    title: 'Company',
    links: [
      { label: 'About', to: '/about' },
      { label: 'Roadmap', to: '/roadmap' },
      { label: 'Security', to: '/security' },
      { label: 'Scope', to: '/scope' },
      { label: 'Contact', to: '/contact' }
    ]
  },
  {
    title: 'Developers',
    links: [
      { label: 'Documentation', to: '/docs' },
      { label: 'API reference', to: '/docs/api' },
      { label: 'SDK', to: '/docs/sdk' },
      { label: 'Architecture', to: '/docs/architecture' },
      { label: 'Contributing', to: '/docs/contributing' },
      { label: 'Changelog', to: '/changelog' }
    ]
  },
  {
    title: 'Explore',
    links: [
      { label: 'Analyze a transaction', to: '/analyze' },
      { label: 'Analyze a wallet', to: '/wallet' },
      { label: 'Network graph', to: '/network' },
      { label: 'Assets & tokens', to: '/assets' },
      { label: 'Watchlist', to: '/watchlist' },
      { label: 'Reports', to: '/reports' }
    ]
  }
];

export interface DocsLink {
  label: string;
  to: string;
  description: string;
  icon: LucideIcon;
}

/** Cards on the developer hub, and the docs sidebar. */
export const docsSections: DocsLink[] = [
  {
    label: 'Documentation',
    to: '/docs',
    description: 'How BlockSense is put together, how to run it, and the concepts behind the analysis.',
    icon: BookOpenIcon
  },
  {
    label: 'API reference',
    to: '/docs/api',
    description: 'Every route, its parameters, and the response envelope — with copyable examples.',
    icon: CodeIcon
  },
  {
    label: 'SDK',
    to: '/docs/sdk',
    description: 'A typed client for the API, with a thin wrapper for the analysis endpoints.',
    icon: BoxesIcon
  },
  {
    label: 'Architecture',
    to: '/docs/architecture',
    description: 'The monorepo layout, the adapter model, and the intelligence pipeline.',
    icon: LayersIcon
  },
  {
    label: 'Contributing',
    to: '/docs/contributing',
    description: 'Local setup, the test suite, the quality gates, and what a good change looks like.',
    icon: GitBranchIcon
  },
  {
    label: 'Changelog',
    to: '/changelog',
    description: 'What changed, and why, in reverse chronological order.',
    icon: ScrollTextIcon
  }
];

/** External repositories and resources. */
export const externalLinks: SiteLink[] = [
  { label: 'GitHub', to: 'https://github.com/vvsrinath/BlockSense-For-Euphoria-KARE-2026-HackFusion-', icon: GithubIcon },
  { label: 'LinkedIn', to: 'https://www.linkedin.com/in/srinath-v-a26b372b7/', icon: LinkedinIcon },
  { label: 'vvsrinath0@gmail.com', to: 'mailto:vvsrinath0@gmail.com', icon: MailIcon },
  { label: 'Security', to: '/security' },
  { label: 'Status', to: '/status' }
];
