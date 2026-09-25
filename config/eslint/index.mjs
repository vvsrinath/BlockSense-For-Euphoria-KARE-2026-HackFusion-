/**
 * ESLint flat config.
 *
 * Split by area because the rules genuinely differ: browser code has hooks and
 * refresh rules, the API is Node-only, and packages carry the domain rules that
 * protect the amount arithmetic.
 */

import js from '@eslint/js';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsparser from '@typescript-eslint/parser';
import prettier from 'eslint-config-prettier';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import globals from 'globals';

export default [
  {
    ignores: [
      '**/dist/**',
      '**/node_modules/**',
      '**/coverage/**',
      'apps/web/tailwind.config.js',
      'apps/web/postcss.config.js'
    ]
  },

  js.configs.recommended,

  // TypeScript everywhere, including type-only files.
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: tsparser,
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: { ...globals.es2021 }
    },
    plugins: {
      '@typescript-eslint': tseslint
    },
    rules: {
      ...tseslint.configs.recommended.rules,
      // TypeScript already reports undefined identifiers, and it understands
      // type-only names that no-undef cannot see. Running both produces false
      // positives on every `RequestInit` or `Response` annotation.
      'no-undef': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }
      ],
      // `any` defeats the point of a shared type layer.
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/consistent-type-imports': [
        'warn',
        { prefer: 'type-imports', fixStyle: 'separate-type-imports' }
      ],
      'no-console': ['warn', { allow: ['warn', 'error'] }]
    }
  },

  // Browser: the web app and the React component package.
  {
    files: ['apps/web/src/**/*.{ts,tsx}', 'packages/ui/src/**/*.{ts,tsx}'],
    languageOptions: {
      globals: { ...globals.browser }
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }]
    }
  },

  // Isomorphic: `@blocksense/blockchain` and `@blocksense/transaction-engine`
  // are imported by both the browser bundle and the Node API, so they need the
  // union of the two global sets rather than either one alone.
  {
    files: ['packages/blockchain/src/**/*.ts', 'packages/transaction-engine/src/**/*.ts'],
    languageOptions: {
      globals: { ...globals.browser, ...globals.node }
    }
  },

  // Node: the API, the scripts, the tests and the tool configuration files.
  {
    files: [
      'apps/api/src/**/*.ts',
      'scripts/**/*.ts',
      'tests/**/*.ts',
      '**/vite.config.ts',
      '**/*.config.ts'
    ],
    languageOptions: {
      // Node 20 has a global fetch, so the test suite legitimately uses
      // RequestInit and Response without importing them.
      globals: { ...globals.node, ...globals.browser }
    },
    rules: {
      'no-console': 'off'
    }
  },

  // Domain rules. These encode decisions that are easy to break silently.
  {
    files: ['packages/transaction-engine/src/**/*.ts'],
    rules: {
      // Token amounts must stay bigint: a float here is a wrong balance.
      '@typescript-eslint/no-explicit-any': 'error',
      eqeqeq: ['error', 'always'],
      'prefer-const': 'error'
    }
  },

  prettier
];
