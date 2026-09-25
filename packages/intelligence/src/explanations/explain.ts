/**
 * Explanations.
 *
 * A score is only useful if the analyst can see why. This module turns signals
 * and assessments into ordered, plain-language findings — no jargon, no
 * unexplained numbers.
 */

import type { AnomalySignal, SignalLevel } from '@blocksense/shared';
import { LEVEL_INFO, levelLabel, maxLevel } from '../scoring/levels';

export interface Finding {
  level: SignalLevel;
  title: string;
  body: string;
  /** Signals that produced this finding, for traceability. */
  signalIds: string[];
}

/** Order findings most severe first, then by how many signals support them. */
export function rankFindings(findings: Finding[]): Finding[] {
  return [...findings].sort(
    (a, b) => LEVEL_INFO[b.level].severity - LEVEL_INFO[a.level].severity || b.signalIds.length - a.signalIds.length
  );
}

/** One finding per signal, phrased as a conclusion rather than a measurement. */
export function toFindings(signals: AnomalySignal[]): Finding[] {
  return rankFindings(
    signals.map((s) => ({
      level: s.level,
      title: s.label,
      body: s.detail,
      signalIds: [s.id]
    }))
  );
}

/** Group signals by level and summarise each group. */
export function summarizeByLevel(signals: AnomalySignal[]): { level: SignalLevel; count: number; headline: string }[] {
  const levels: SignalLevel[] = ['high', 'unusual', 'info', 'normal'];
  return levels
    .map((level) => {
      const group = signals.filter((s) => s.level === level);
      return {
        level,
        count: group.length,
        headline:
          group.length === 0
            ? `No ${levelLabel(level).toLowerCase()} signals`
            : `${group.length} ${levelLabel(level).toLowerCase()} signal${group.length === 1 ? '' : 's'}`
      };
    })
    .filter((entry) => entry.count > 0 || entry.level === 'high');
}

/** The single most important thing to say about a set of signals. */
export function headlineFor(signals: AnomalySignal[]): string {
  if (signals.length === 0) return 'No anomalies detected.';
  const worst = signals.reduce<SignalLevel>((acc, s) => maxLevel(acc, s.level), 'normal');
  const count = signals.filter((s) => s.level === worst).length;
  return `${count} ${levelLabel(worst).toLowerCase()} signal${count === 1 ? '' : 's'} detected.`;
}

/** Render a report-ready markdown summary. */
export function toMarkdown(score: number, signals: AnomalySignal[]): string {
  const findings = toFindings(signals);
  const lines = [
    `# Transaction analysis`,
    ``,
    `**Anomaly score:** ${score}/100`,
    `**Assessment:** ${headlineFor(signals)}`,
    ``,
    `## Findings`,
    ``
  ];

  if (findings.length === 0) {
    lines.push(`No anomalies were detected for this transaction.`);
  } else {
    findings.forEach((f) => {
      lines.push(`### ${f.title} _(${levelLabel(f.level)})_`);
      lines.push(f.body);
      lines.push(``);
    });
  }

  return lines.join('\n');
}
