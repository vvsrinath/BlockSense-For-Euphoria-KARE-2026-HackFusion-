import { CircleCheckIcon, CircleSlashIcon, ShieldQuestionIcon } from 'lucide-react';
import { Panel } from '@blocksense/ui';
import { canDo, cannotDo } from '../../data/marketing';
import { CtaBand, PageIntro, Section, TruthList } from '../../components/public/marketing';

/**
 * What BlockSense does and does not do.
 *
 * A tool that scores addresses is one sentence away from being read as an
 * accusation engine. This page exists to make the boundary explicit, because
 * the limits are real product constraints and not disclaimers.
 */
export function Scope() {
  return (
    <>
      <Section>
        <PageIntro
          eyebrow="Scope"
          title="What BlockSense can and cannot tell you"
          description="Blockchain analysis is powerful, and its limits matter more than its capabilities. Everything below is a real constraint of how the product works, not a disclaimer."
        />
      </Section>

      <Section className="pt-0">
        <div className="grid gap-6 lg:grid-cols-2">
          <Panel>
            <div className="flex items-center gap-2.5">
              <CircleCheckIcon className="h-5 w-5 text-success" aria-hidden="true" />
              <h2 className="text-[15px] font-semibold text-ink">BlockSense can</h2>
            </div>
            <p className="mt-1.5 text-sm text-muted">
              Analyse observable on-chain activity, and say clearly when that activity differs from a
              wallet’s own history.
            </p>
            <div className="mt-5">
              <TruthList items={canDo} tone="yes" />
            </div>
          </Panel>

          <Panel>
            <div className="flex items-center gap-2.5">
              <CircleSlashIcon className="h-5 w-5 text-warning-ink" aria-hidden="true" />
              <h2 className="text-[15px] font-semibold text-ink">BlockSense cannot</h2>
            </div>
            <p className="mt-1.5 text-sm text-muted">
              A score is a statistical signal about behaviour. It is not evidence of a crime, and it is
              not a verdict on a person.
            </p>
            <div className="mt-5">
              <TruthList items={cannotDo} tone="no" />
            </div>
          </Panel>
        </div>

        <div className="mx-auto mt-6 max-w-3xl rounded-2xl border border-line bg-surface p-6 shadow-card">
          <div className="flex gap-3">
            <ShieldQuestionIcon className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
            <div>
              <h2 className="text-[15px] font-semibold text-ink">How to read an anomaly score</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                The score answers one question: does this transaction look like the ones this wallet has
                made before? The <span className="font-medium text-ink">confidence</span> answers a
                different one: how much evidence justified that. A high score with low confidence is a
                prompt to look, not a finding. When there is not enough history to compare against,
                BlockSense says so rather than reporting a confident zero.
              </p>
              <p className="mt-3 text-sm leading-relaxed text-muted">
                An address is a pseudonym. Two addresses may belong to one person, and one address may be
                shared by many. Any label, cluster, or identity attached to an address elsewhere is an
                assumption made outside this product.
              </p>
            </div>
          </div>
        </div>
      </Section>

      <Section className="pt-0">
        <CtaBand
          title="See the limits for yourself"
          description="Analyse a real transaction and read exactly which signals fired, how confident the score is, and what it does not claim."
          primary={{ label: 'Analyze a transaction', to: '/analyze' }}
          secondary={{ label: 'How it works', to: '/how-it-works' }}
        />
      </Section>
    </>
  );
}
