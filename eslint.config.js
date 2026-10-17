import js from '@eslint/js';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['dist', 'coverage', 'node_modules'] },
  {
    files: ['**/*.{ts,tsx}'],
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    languageOptions: { ecmaVersion: 2022, globals: globals.browser },
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/consistent-type-imports': 'error',
    },
  },
  {
    files: ['src/ui/**/*.{ts,tsx}', 'src/main.tsx'],
    plugins: { 'react-hooks': reactHooks },
    rules: reactHooks.configs.recommended.rules,
  },
  {
    files: ['src/sim/**/*.ts', '*.config.{js,ts}'],
    languageOptions: { globals: globals.node },
  },
  // The engine and data layers must stay pure and deterministic:
  // no DOM, no React, no ambient randomness or wall-clock time.
  {
    files: ['src/engine/**/*.ts', 'src/data/**/*.ts'],
    languageOptions: { globals: { ...globals.es2021 } },
    rules: {
      'no-restricted-globals': [
        'error',
        { name: 'Date', message: 'Engine must be deterministic: no wall-clock time.' },
        { name: 'window', message: 'Engine must not touch the DOM.' },
        { name: 'document', message: 'Engine must not touch the DOM.' },
        { name: 'localStorage', message: 'Persistence belongs in the UI layer.' },
        { name: 'performance', message: 'Engine must be deterministic: no timers.' },
      ],
      'no-restricted-properties': [
        'error',
        { object: 'Math', property: 'random', message: 'Use the seeded Rng passed into the engine.' },
      ],
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            { group: ['react', 'react-dom', 'react/*'], message: 'Engine must not depend on React.' },
            { group: ['**/ui/**', '**/sim/**'], message: 'Engine must not import from ui/ or sim/.' },
          ],
        },
      ],
    },
  },
);
