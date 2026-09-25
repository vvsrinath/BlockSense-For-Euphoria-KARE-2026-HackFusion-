import { defiNamesByChain, demoNetworkEntities, exchangeNames } from '../mock/mockNetwork';
import { DEMO_WALLET } from '../mock/mockAddresses';
import { createRandom, fakeAddress, hashString } from '@blocksense/shared';
import type { ChainId, NetworkEntity, NetworkGraphData, NetworkLink, NodeKind } from '@blocksense/shared';
import { mockRequest, sameValue } from '@blocksense/blockchain';
import { findWallet } from './wallets';
import { allTransactions } from './transactions';

export function buildLinks(entities: NetworkEntity[], centerId: string): NetworkLink[] {
  return entities.
  filter((e) => e.id !== centerId).
  map((e) => {
    const source = e.parentId ?? centerId;
    return {
      id: `${source}->${e.id}`,
      source,
      target: e.id,
      txCount: e.txCount,
      volumeUsd: e.totalUsd,
      flagged: e.level === 'high' || e.kind === 'high'
    };
  });
}

function generatedEntity(rand: () => number, chain: ChainId, id: string, parentId: string | undefined, allowed: NodeKind[]): NetworkEntity {
  const kind = allowed[Math.floor(rand() * allowed.length)];
  const defi = defiNamesByChain[chain] ?? [];
  const label =
  kind === 'exchange' ?
  exchangeNames[Math.floor(rand() * exchangeNames.length)] :
  kind === 'defi' && defi.length ?
  defi[Math.floor(rand() * defi.length)] :
  kind === 'new' ?
  'New wallet' :
  kind === 'high' ?
  'High-anomaly wallet' :
  kind === 'contract' ?
  'Contract' :
  'Wallet';
  const level = kind === 'high' ? 'high' : kind === 'new' ? 'unusual' : 'normal';
  const txCount = Math.round(2 + rand() * 180);
  return {
    id,
    address: fakeAddress(rand, chain),
    label,
    kind,
    level,
    firstSeen: Date.UTC(2022 + Math.floor(rand() * 3), Math.floor(rand() * 12), 1 + Math.floor(rand() * 27)),
    txCount,
    totalUsd: Math.round(txCount * (40 + rand() * 400)),
    relationship: kind === 'new' ? 'Recent first interaction' : parentId ? 'Second-degree connection' : 'Observed counterparty',
    parentId
  };
}

function genericNetwork(address: string): NetworkGraphData | null {
  const wallet = findWallet(address);
  if (!wallet) return null;
  const rand = createRandom(hashString(`${wallet.address}:network`));
  const center: NetworkEntity = {
    id: 'center',
    address: wallet.address,
    label: 'Selected wallet',
    kind: 'center',
    level: wallet.status,
    firstSeen: wallet.firstSeen,
    txCount: wallet.txCount,
    totalUsd: wallet.totalInUsd + wallet.totalOutUsd,
    relationship: 'Wallet under analysis'
  };
  const known: NetworkEntity[] = [];
  const seen = new Set<string>([wallet.address.toLowerCase()]);

  allTransactions().
  filter((tx) => sameValue(tx.from, address) || sameValue(tx.to, address)).
  flatMap((tx) => tx.related).
  forEach((r, i) => {
    if (seen.has(r.address.toLowerCase())) return;
    seen.add(r.address.toLowerCase());
    known.push({
      id: `rel-${i}`,
      address: r.address,
      label: r.label,
      kind: r.kind === 'center' ? 'wallet' : r.kind,
      level: r.level,
      firstSeen: wallet.firstSeen,
      txCount: Math.round(3 + rand() * 60),
      totalUsd: Math.round(wallet.dna.medianUsd * (4 + rand() * 30)),
      relationship: r.relationship
    });
  });

  wallet.activity.forEach((a, i) => {
    if (seen.has(a.counterparty.toLowerCase())) return;
    seen.add(a.counterparty.toLowerCase());
    const isDemo = sameValue(a.counterparty, DEMO_WALLET);
    known.push({
      id: `act-${i}`,
      address: a.counterparty,
      label: isDemo ? 'Demo sender' : 'Wallet',
      kind: a.level === 'high' ? 'high' : 'wallet',
      level: a.level,
      firstSeen: wallet.firstSeen,
      txCount: Math.round(1 + rand() * 20),
      totalUsd: Math.round(a.valueUsd * (1 + rand() * 3)),
      relationship: a.direction === 'in' ? 'Sent funds to this wallet' : 'Received funds from this wallet'
    });
  });

  const allowed: NodeKind[] = wallet.chain === 'bitcoin' ? ['wallet', 'wallet', 'exchange'] : ['wallet', 'wallet', 'exchange', 'defi', 'contract'];
  const fillers = Array.from({ length: Math.max(0, 10 - known.length) }, (_, i) => generatedEntity(rand, wallet.chain, `gen-${i}`, undefined, allowed));
  const entities = [center, ...known, ...fillers];
  return { centerId: 'center', chain: wallet.chain, entities, links: buildLinks(entities, 'center') };
}

export async function getNetwork(address: string): Promise<NetworkGraphData | null> {
  return mockRequest(() => {
    if (sameValue(address, DEMO_WALLET)) {
      return { centerId: 'center', chain: 'ethereum' as ChainId, entities: demoNetworkEntities, links: buildLinks(demoNetworkEntities, 'center') };
    }
    return genericNetwork(address);
  }, 160);
}

export function expandEntity(parent: NetworkEntity, chain: ChainId, count = 3): NetworkEntity[] {
  const rand = createRandom(hashString(`${parent.address}:expand`));
  const allowed: NodeKind[] = parent.kind === 'high' || parent.kind === 'new' ? ['wallet', 'new', 'high', 'wallet'] : ['wallet', 'wallet', 'exchange', 'defi', 'new'];
  return Array.from({ length: count }, (_, i) => generatedEntity(rand, chain, `${parent.id}-x${i}`, parent.id, allowed));
}