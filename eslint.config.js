import fs from 'node:fs';

/** Minimal ESLint config compatible with the project's TypeScript + React setup */
export default {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2024,
    sourceType: 'module',
    ecmaFeatures: { jsx: true }
  },
  plugins: ['@typescript-eslint', 'react'],
  extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended', 'plugin:react/recommended'],
  settings: { react: { version: 'detect' } },
  env: { browser: true, es2024: true, node: true },
  rules: {
    // keep defaults but allow dev flexibility
    'no-console': 'warn',
    '@typescript-eslint/no-explicit-any': 'off'
  }
};
