import { api } from './api';
import { detectInput } from '@blocksense/blockchain';
import type { ChainId, Report } from '@blocksense/shared';

/**
 * Report summaries created in this API process, newest first.
 *
 * The list route deliberately omits section bodies: they are the expensive part
 * of a report and the cards never render them.
 */
export async function listReports(): Promise<Omit<Report, 'sections'>[]> {
  const { reports } = await api.reports();
  return reports;
}

/**
 * Fetch a report.
 *
 * The store lives in API process memory, so a report from a previous deploy will
 * be reported as missing rather than as an error worth showing a stack for.
 */
export async function getReport(id: string): Promise<Report | null> {
  try {
    return await api.report(id);
  } catch {
    return null;
  }
}

/**
 * Generate a report for a transaction and return its id.
 *
 * The heavy lifting — analysis, section text — happens server-side, so this is a
 * single call rather than a client-side composition.
 */
export async function generateReportForTransaction(hash: string, chain?: ChainId, address?: string): Promise<string> {
  const resolved = chain ?? detectInput(hash).chains[0] ?? 'ethereum';
  const report = await api.createReport(resolved, hash, address);
  return report.id;
}
