import { mockReports } from '../data/mockReports';
import type { Report, ReportMeta, ReportSection } from '../types/report';
import type { Transaction } from '../types/transaction';
import { formatAmount, formatDate, formatDateTime, formatMoney, formatNumber, truncateMiddle } from '../utils/format';
import { getChain } from '../utils/chains';
import { mockRequest, sameValue } from './client';
import { findTransaction } from './transactions';
import { findWallet } from './wallets';

const STORAGE_KEY = 'blocksense.reports';

function storedReports(): ReportMeta[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]') as ReportMeta[];
  } catch {
    return [];
  }
}

function allMeta(): ReportMeta[] {
  return [...storedReports(), ...mockReports].sort((a, b) => b.createdAt - a.createdAt);
}

function assetLabel(tx: Transaction): string {
  if (tx.asset.type === 'nft') return `${tx.asset.collection ?? tx.asset.name} #${tx.asset.tokenId}`;
  return formatAmount(tx.asset.amount ?? '0', tx.asset.symbol);
}

function describeWallet(address: string, role: 'sender' | 'receiver'): string {
  const w = findWallet(address);
  if (!w) return `Limited history is available for the ${role} (${truncateMiddle(address)}) in the current dataset.`;
  return `The ${role} has been active since ${formatDate(w.firstSeen)} with ${formatNumber(w.txCount)} transactions. It typically moves ${w.dna.typicalAmount}, about ${w.dna.typicalFrequency}, mostly using ${w.dna.commonAsset}. ${w.statusNote}`;
}

export function buildReport(meta: ReportMeta, tx: Transaction): Report {
  const chain = getChain(tx.chain);
  const anomaly = tx.anomaly;
  const level = anomaly?.level ?? 'normal';
  const flagged = tx.related.filter((r) => r.level === 'high');
  const relationship = anomaly?.details.find((d) => d.kind === 'relationship');
  const findings = [...(anomaly?.signals ?? [])];
  if (flagged.length) findings.push('Network contains unusual connections');
  if (!findings.length) findings.push('Behavior is consistent with the observed history');

  const finalText =
  level === 'high' ?
  'Observed behavior differs significantly from the available historical pattern. These signals describe how this activity differs from history; they are not proof of wrongdoing. The transfer requires investigation before any conclusion is drawn.' :
  level === 'unusual' ?
  'Some observed behavior differs from the historical pattern, while most signals remain within normal ranges. A brief review is suggested.' :
  'Observed behavior is consistent with the available historical pattern. No further action is suggested.';

  const sections: ReportSection[] = [
  {
    id: 'summary',
    title: 'Transaction summary',
    body: tx.summary.join(' '),
    facts: [
    { label: 'Transaction', value: truncateMiddle(tx.hash, 10, 8) },
    { label: 'Network', value: chain.name },
    { label: 'Block', value: formatNumber(tx.block) },
    { label: 'Time', value: formatDateTime(tx.timestamp) },
    { label: 'Status', value: tx.status === 'confirmed' ? 'Confirmed' : tx.status },
    { label: 'Fee', value: tx.fee ? `${tx.fee.amount} ${tx.fee.symbol}` : '—' }]

  },
  {
    id: 'asset',
    title: 'Asset movement',
    body: `${assetLabel(tx)}${tx.asset.valueUsd ? ` (≈ ${formatMoney(tx.asset.valueUsd)})` : ''} moved as a ${tx.asset.type === 'native' ? 'native asset transfer' : tx.asset.type === 'nft' ? 'NFT transfer' : 'token transfer'}.`,
    facts: [
    { label: 'Asset', value: `${tx.asset.name} (${tx.asset.symbol})` },
    { label: 'Standard', value: tx.asset.standard ?? 'Native' },
    ...(tx.asset.contractAddress ? [{ label: 'Contract', value: truncateMiddle(tx.asset.contractAddress, 8, 6) }] : [])]

  },
  { id: 'sender', title: 'Sender behavior', body: describeWallet(tx.from, 'sender') },
  { id: 'receiver', title: 'Receiver behavior', body: describeWallet(tx.to, 'receiver') },
  {
    id: 'relationship',
    title: 'Relationship analysis',
    body: relationship ? `${relationship.value}. ${relationship.detail}` : 'No relationship data is available for this pair of wallets.'
  },
  {
    id: 'network',
    title: 'Network analysis',
    body: `${tx.related.length} observed connections around this transaction.${flagged.length ? ` ${flagged.length} of them ${flagged.length === 1 ? 'is' : 'are'} a high-anomaly wallet: ${flagged.map((f) => truncateMiddle(f.address)).join(', ')}. This is an observed network connection, not an attribution.` : ' None of them show high-anomaly behavior.'}`,
    facts: tx.related.map((r) => ({ label: r.label, value: r.relationship }))
  },
  {
    id: 'signals',
    title: 'Anomaly signals',
    body: `Anomaly score ${anomaly?.score ?? 0} / 100. The score highlights behavior that differs from the observed history. It is not proof of wrongdoing.`,
    facts: (anomaly?.details ?? []).map((d) => ({ label: d.label, value: `${d.value} — ${d.detail}` }))
  },
  { id: 'final', title: 'Final observations', body: finalText }];


  return {
    id: meta.id,
    title: 'Transaction Risk Report',
    txHash: tx.hash,
    subject: tx.hash,
    chain: tx.chain,
    assetLabel: assetLabel(tx),
    score: anomaly?.score ?? 0,
    level,
    createdAt: meta.createdAt,
    findings,
    sections
  };
}

export async function listReports(): Promise<Report[]> {
  return mockRequest(
    () =>
    allMeta().
    map((m) => {
      const tx = findTransaction(m.txHash);
      return tx ? buildReport(m, tx) : null;
    }).
    filter((r): r is Report => r !== null),
    100
  );
}

export async function getReport(id: string): Promise<Report | null> {
  return mockRequest(() => {
    const meta = allMeta().find((m) => m.id === id);
    const tx = meta ? findTransaction(meta.txHash) : undefined;
    return meta && tx ? buildReport(meta, tx) : null;
  }, 140);
}

export async function generateReportForTransaction(hash: string): Promise<string> {
  return mockRequest(() => {
    const existing = allMeta().find((m) => sameValue(m.txHash, hash));
    if (existing) return existing.id;
    const meta: ReportMeta = { id: `rpt-${Date.now().toString(36)}`, txHash: hash, createdAt: Date.now() };
    localStorage.setItem(STORAGE_KEY, JSON.stringify([meta, ...storedReports()]));
    return meta.id;
  }, 300);
}