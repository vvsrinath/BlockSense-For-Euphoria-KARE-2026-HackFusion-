/**
 * Who built BlockSense.
 *
 * Kept as data so the name and links appear identically in the footer, the
 * about page, the contact page, and the application chrome. The previous
 * version of the app invented a signed-in user called "Alex Morgan" with a
 * `alex@demo.blocksense.app` address and a sign-out button — for a product with
 * no accounts and no database. A fabricated identity is the same problem as
 * fabricated chain data: it looks like something real and is not.
 */

import type { LucideIcon } from 'lucide-react';
import {
  BlocksIcon,
  BrainIcon,
  CodeIcon,
  CompassIcon,
  GraduationCapIcon,
  LayersIcon,
  NetworkIcon,
  PackageIcon,
  ShieldCheckIcon
} from 'lucide-react';

export const developer = {
  name: 'Srinath Vatchavari Venkateshan',
  /** Used where the full name will not fit. */
  shortName: 'Srinath V.V.',
  initials: 'SV',
  role: 'Student developer · Blockchain intelligence',
  bio: 'A student developer and technology enthusiast working across software engineering, blockchain, artificial intelligence, cybersecurity, and product development.',
  email: 'vvsrinath0@gmail.com',
  github: 'https://github.com/vvsrinath',
  githubHandle: 'vvsrinath',
  linkedin: 'https://www.linkedin.com/in/srinath-v-a26b372b7/',
  /**
   * Portrait, in `apps/web/public`.
   *
   * Optional on purpose: the page renders initials if it is missing, because a
   * broken image icon is worse than an honest monogram.
   */
  photo: '/developer.jpg',
  location: 'Kalasalingam University, India'
} as const;

/** The question the project grew out of, quoted on the about page. */
export const origin = {
  question: 'What if blockchain transactions could be understood through behavior, not just transaction details?',
  answer:
    'That question became BlockSense: a modular platform that turns raw chain data into context you can reason about, rather than a table of hashes to decode by hand.'
};

/** What the project is, as a set of disciplines rather than a feature list. */
export const disciplines = [
  { label: 'Blockchain data analysis', icon: NetworkIcon },
  { label: 'TypeScript and JavaScript', icon: CodeIcon },
  { label: 'Multi-chain architecture', icon: LayersIcon },
  { label: 'Behavioural analysis', icon: BrainIcon },
  { label: 'Anomaly detection', icon: ShieldCheckIcon },
  { label: 'Network graph analysis', icon: CompassIcon },
  { label: 'Asset intelligence', icon: PackageIcon },
  { label: 'REST API design', icon: BlocksIcon }
];

export interface Principle {
  title: string;
  body: string;
  icon: LucideIcon;
}

export const principles: Principle[] = [
  {
    title: 'Build practical technology',
    body: 'BlockSense is a working software platform, not a theoretical concept. It reads real chains, serves real data, and is judged on whether it works.',
    icon: BlocksIcon
  },
  {
    title: 'Keep complex systems understandable',
    body: 'Blockchain infrastructure is complicated. The goal is to hide that complexity from the reader while keeping the architecture itself modular and transparent.',
    icon: LayersIcon
  },
  {
    title: 'Build for expansion',
    body: 'New chains, intelligence modules, API routes, and features can be added without rebuilding the application. The adapter model exists for exactly that reason.',
    icon: CompassIcon
  },
  {
    title: 'Learn by building',
    body: 'BlockSense is a continuous learning project across blockchain infrastructure, software architecture, data analysis, cybersecurity, and product engineering.',
    icon: GraduationCapIcon
  }
];

export interface Interest {
  title: string;
  body: string;
  icon: LucideIcon;
}

export const interests: Interest[] = [
  {
    title: 'Software engineering',
    body: 'Web applications, APIs, developer tooling, and software architectures that stay maintainable as they grow.',
    icon: CodeIcon
  },
  {
    title: 'Artificial intelligence',
    body: 'Machine learning, computer vision, intelligent analysis, and AI-assisted software systems.',
    icon: BrainIcon
  },
  {
    title: 'Blockchain',
    body: 'Chain infrastructure, transaction systems, wallets, smart contracts, and decentralised networks.',
    icon: NetworkIcon
  },
  {
    title: 'Cybersecurity',
    body: 'Security monitoring, anomaly detection, digital investigation, and defensive technology.',
    icon: ShieldCheckIcon
  },
  {
    title: 'Product development',
    body: 'Turning technical ideas into usable products with practical interfaces and real workflows.',
    icon: CompassIcon
  },
  {
    title: 'Open source',
    body: 'Learning through collaboration, contributing to other projects, and building software other developers can extend.',
    icon: PackageIcon
  }
];

export const closing = {
  goal: 'To keep building technology that connects software engineering, intelligent systems, cybersecurity, and real-world applications.',
  motto: 'Build it. Understand it. Improve it. Share it.',
  tagline: 'See the transaction. Understand the behavior.'
};
