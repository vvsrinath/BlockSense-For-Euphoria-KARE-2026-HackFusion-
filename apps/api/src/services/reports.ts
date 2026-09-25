/**
 * Reports: a stored, shareable summary of one analysis.
 *
 * BlockSense has no database by design, so reports live in process memory. That
 * makes them perfect for a single-instance deployment and useless for a scaled
 * one, which is called out in every generated report rather than hidden: the id
 * is only meaningful for as long as the process is alive.
 */

import type { ChainId, Report, ReportSection } from '@blocksense/shared';
import { analyze, getTransaction } from './index';
import type { AnalysisResult } from '@blocksense/intelligence';
import { getChain } from '@blocksense/blockchain';

/**
 * Bounded so a long-running process cannot accumulate reports forever. The
 * oldest is dropped first, which is the least surprising eviction for a report
 * store: the newest is what a user is most likely to come back for.
 */
const MAX_REPORTS = 200;
const reports = new Map<string, Report>();

function put(report: Report): void {
  reports.set(report.id, report);
  while (reports.size > MAX_REPORTS) {
    const oldest = reports.keys().next();
    if (oldest.done) break;
    reports.delete(oldest.value);
  }
}

/** A URL-safe id, so a report can be linked without escaping. */
function reportId(): string {
  const alphabet = 'abcdefghijklmnopqrstuvwxyz0123456789';
  const bytes = new Uint8Array(12);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => alphabet[b % alphabet.length]).join('');
}

function section(
  id: string,
  title: string,
  body: string,
  facts?: { label: string; value: string }[]
): ReportSection {
  return { id, title, body, ...(facts ? { facts } : {}) };
}

function buildSections(chain: ChainId, analysis: AnalysisResult, transactionHash: string): ReportSection[] {
  const info = getChain(chain);
  const sections: ReportSection[] = [
    section(
      'summary',
      'Summary',
      `Transaction ${transactionHash} scored ${analysis.score.score}/100 on ${info.name}, which is "${analysis.score.level}". ${analysis.headline}`,
      [
        { label: 'Chain', value: info.name },
        { label: 'Transaction', value: transactionHash },
        { label: 'Score', value: `${analysis.score.score}/100` },
        { label: 'Level', value: analysis.score.level }
      ]
    )
  ];

  if (analysis.findings.length > 0) {
    sections.push(
      section(
        'findings',
        'Findings',
        'What the analysis flagged, most severe first.',
        analysis.findings.map((finding) => ({ label: finding.title, value: finding.body }))
      )
    );
  }

  if (analysis.score.contributing.length > 0) {
    sections.push(
      section(
        'signals',
        'Contributing signals',
        'Each signal below added weight to the score.',
        analysis.score.contributing.map((signal) => ({ label: signal.label, value: `${signal.value} (${signal.level})` }))
      )
    );
  }

  sections.push(
    section('method', 'Method', [
      'Scores are computed from the transaction itself and the submitting wallet’s own history.',
      'There is no database and no third-party risk feed, so a high score means "unusual for this wallet", not "known malicious".',
      'Verify against a block explorer before acting on any finding.'
    ].join(' '))
  );

  return sections;
}

export async function createReport(chain: ChainId, hash: string, focusAddress?: string): Promise<Report> {
  // Analysis needs the transaction, and the report needs its raw fields, so the
  // provider is consulted at most twice and the second read is cached.
  const [analysis, transaction] = await Promise.all([
    analyze(chain, hash, focusAddress),
    getTransaction(chain, hash)
  ]);

  const report: Report = {
    id: reportId(),
    title: `${getChain(chain).name} risk report — ${hash.slice(0, 10)}…`,
    txHash: hash,
    subject: focusAddress ?? transaction.from,
    chain,
    assetLabel: `${transaction.asset.amount ?? '?'} ${transaction.asset.symbol}`,
    score: analysis.score.score,
    level: analysis.score.level,
    createdAt: Date.now(),
    findings: analysis.findings.map((f) => `${f.title}: ${f.body}`),
    sections: buildSections(chain, analysis, hash)
  };

  put(report);
  return report;
}

export function getReport(id: string): Report | undefined {
  return reports.get(id);
}

export function listReports(): { total: number; reports: Omit<Report, 'sections'>[] } {
  return {
    total: reports.size,
    // Sections are omitted from the list view: they are the bulk of the payload
    // and useless without opening the report.
    reports: [...reports.values()]
      .map(({ sections: _sections, ...rest }) => rest)
      .sort((a, b) => b.createdAt - a.createdAt)
  };
}
