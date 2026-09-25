/**
 * Prettier configuration.
 *
 * Kept in `config/prettier` so every formatting decision in the repository is
 * visible in one place, and the root `.prettierrc.cjs` simply re-exports it.
 *
 * Notable choices:
 * - `singleQuote` matches the existing source style.
 * - `printWidth: 100` is wider than Prettier's default because the domain types
 *   read better on one line.
 * - Trailing commas follow ES5 so the output stays valid in every target.
 */

module.exports = {
  printWidth: 100,
  singleQuote: true,
  semi: true,
  trailingComma: 'es5',
  arrowParens: 'always',
  tabWidth: 2,
  useTabs: false,
  bracketSpacing: true,
  endOfLine: 'lf',
  overrides: [
    {
      files: '*.md',
      options: {
        // Prose should not be hard-wrapped in source.
        proseWrap: 'preserve'
      }
    }
  ]
};
