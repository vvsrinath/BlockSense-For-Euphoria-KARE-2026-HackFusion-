import { BookOpenIcon, GithubIcon, LinkedinIcon, MailIcon, type LucideIcon } from 'lucide-react';
import { developer } from '../../data/developer';
import { DeveloperPortrait } from './DeveloperPortrait';

/**
 * A direct line to the person who built the project.
 *
 * The rest of the contact page is a list of *routes* — issue tracker, docs,
 * product. This is the one place that answers "who do I actually email, and
 * what should I put in the message", which is the question a visitor arrives
 * with. It is deliberately not a form: a form needs a mail service and a store
 * of submissions, and this project has neither. A published address that a real
 * person reads is worth more than an input that silently discards what you type.
 */

const REPO_SLUG = 'BlockSense-For-Euphoria-KARE-2026-HackFusion-';

const channels: { icon: LucideIcon; label: string; value: string; href: string; external: boolean; hint: string }[] = [
  {
    icon: MailIcon,
    label: 'Email',
    value: developer.email,
    href: `mailto:${developer.email}`,
    external: false,
    hint: 'Bugs, ideas, collaboration, and anything about the project itself.'
  },
  {
    icon: LinkedinIcon,
    label: 'LinkedIn',
    value: 'Connect on LinkedIn',
    href: developer.linkedin,
    external: true,
    hint: 'Professional background, and a fine place to open a conversation.'
  },
  {
    icon: GithubIcon,
    label: 'GitHub',
    value: developer.githubHandle,
    href: `${developer.github}/${REPO_SLUG}`,
    external: true,
    hint: 'Read the code, open an issue, or send a pull request.'
  }
];

/** What makes a message answerable on the first try. */
const checklist = [
  'What you were doing on the site or in the app.',
  'The transaction hash, wallet address, or chain involved.',
  'What you expected to happen, and what happened instead.'
];

export function ContactDeveloper() {
  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-surface shadow-card">
      {/* The identity half: who you are writing to. */}
      <div className="flex flex-col items-center gap-6 border-b border-line bg-gradient-to-br from-primary/[0.07] to-transparent p-6 text-center sm:flex-row sm:items-start sm:gap-7 sm:p-8 sm:text-left">
        <DeveloperPortrait eager className="h-28 w-28 ring-2 ring-primary/20 sm:h-36 sm:w-36" />

        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-primary">Contact the developer</p>
          <h2 className="mt-2 text-xl font-semibold tracking-tight text-ink md:text-2xl">
            {developer.name}
          </h2>
          <p className="mt-1 text-sm text-primary">{developer.role}</p>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            Every message here goes to {developer.shortName} — the developer of BlockSense. There is no
            support team, no ticket queue, and no form in between. The address is a real inbox and the
            replies come from the person who wrote the code.
          </p>
          <p className="mt-3 text-xs text-muted">
            Based in {developer.location}. This is a student project, so replies can take a few days.
          </p>
        </div>
      </div>

      {/* The action half: the three ways to actually reach them. */}
      <div className="grid gap-px bg-line sm:grid-cols-3">
        {channels.map((channel) => {
          const Icon = channel.icon;
          return (
            <a
              key={channel.label}
              href={channel.href}
              {...(channel.external ? { target: '_blank', rel: 'noreferrer noopener' } : {})}
              className="group flex flex-col items-center gap-2 bg-surface p-5 text-center transition-colors duration-150 hover:bg-subtle sm:p-6">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <span className="text-xs font-semibold uppercase tracking-[0.1em] text-muted">{channel.label}</span>
              <span className="break-words text-sm font-medium text-ink group-hover:text-primary group-hover:underline">
                {channel.value}
              </span>
              <span className="text-xs leading-relaxed text-muted">{channel.hint}</span>
            </a>
          );
        })}
      </div>

      {/* So a message is useful on the first reply. */}
      <div className="border-t border-line p-6 sm:p-8">
        <div className="flex gap-4">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <BookOpenIcon className="h-5 w-5" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <h3 className="text-[15px] font-semibold text-ink">What to include</h3>
            <p className="mt-1 text-sm leading-relaxed text-muted">
              These three details are usually the difference between a bug that gets fixed and a bug that
              gets set aside.
            </p>
            <ul className="mt-3 space-y-2">
              {checklist.map((item) => (
                <li key={item} className="flex gap-2.5 text-sm leading-relaxed text-muted">
                  <span className="mt-[0.45rem] h-1.5 w-1.5 shrink-0 rounded-full bg-primary" aria-hidden="true" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
