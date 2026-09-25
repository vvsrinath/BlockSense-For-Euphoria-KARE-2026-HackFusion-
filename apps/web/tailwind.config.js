const token = (name) => `rgb(var(${name}) / <alpha-value>)`;

export default {
  darkMode: 'class',

  // Tailwind must scan both the app and the workspace packages, or every class
  // used inside packages/ui is purged from the build. These globs are relative
  // to this file, hence the ../../packages path.
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
    '../../packages/*/src/**/*.{js,ts,jsx,tsx}'
  ],

  theme: {
    extend: {
      colors: {
        bg: token('--bg'),
        surface: token('--surface'),
        subtle: token('--subtle'),
        ink: token('--ink'),
        'brand-ink': token('--brand-ink'),
        muted: token('--muted'),
        line: token('--line'),
        'line-strong': token('--line-strong'),
        primary: token('--primary'),
        cyan: token('--cyan'),
        success: token('--success'),
        'success-ink': token('--success-ink'),
        warning: token('--warning'),
        'warning-ink': token('--warning-ink'),
        danger: token('--danger'),
        'danger-ink': token('--danger-ink'),
        purple: token('--purple'),
        orange: token('--orange'),
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      boxShadow: {
        card: '0 1px 2px rgb(15 23 42 / 0.04), 0 1px 3px rgb(15 23 42 / 0.03)',
        pop: '0 12px 32px -12px rgb(15 23 42 / 0.25), 0 2px 6px rgb(15 23 42 / 0.06)',
      },
      transitionTimingFunction: {
        out: 'cubic-bezier(0.23, 1, 0.32, 1)',
      },
      maxWidth: {
        content: '72rem'
      },
    },
  },
};
