import { ArrowLeftRightIcon, FingerprintIcon, LayersIcon, NetworkIcon, type LucideIcon } from 'lucide-react';

export interface Feature {
  title: string;
  description: string;
  icon: LucideIcon;
  points: string[];
}

export const features: Feature[] = [
{
  title: 'Transaction Intelligence',
  description: 'See exactly what moved, who sent it, who received it and what it cost.',
  icon: ArrowLeftRightIcon,
  points: ['Amount', 'Asset', 'Sender', 'Receiver', 'Time', 'Fee']
},
{
  title: 'Behavioral Intelligence',
  description: 'Compare every transaction with the wallet’s own history to spot what changed.',
  icon: FingerprintIcon,
  points: ['Unusual amount', 'New relationships', 'Frequency changes', 'Time anomalies']
},
{
  title: 'Network Intelligence',
  description: 'Follow wallet connections to exchanges, contracts and DeFi protocols.',
  icon: NetworkIcon,
  points: ['Wallet connections', 'Exchanges', 'Contracts', 'DeFi']
},
{
  title: 'Multi-Chain Analysis',
  description: 'One search box for the networks people actually use.',
  icon: LayersIcon,
  points: ['Bitcoin', 'Ethereum', 'BNB Chain', 'TRON', 'Solana']
}];


export interface JourneyStep {
  title: string;
  description: string;
}

export const journeySteps: JourneyStep[] = [
{ title: 'Paste a hash or address', description: 'BlockSense detects the input type and the blockchain automatically.' },
{ title: 'Understand what happened', description: 'Asset, amount, sender and receiver explained in plain language.' },
{ title: 'See what is unusual', description: 'An explainable anomaly score shows how behavior differs from history.' },
{ title: 'Investigate and report', description: 'Explore the network, then save or share a clear report.' }];