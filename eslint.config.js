import eslint from '@eslint/js';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import prettier from 'eslint-config-prettier';

export default [
  { ignores: ['dist/**', 'node_modules/**'] },
  eslint.configs.recommended,
  {
    files: ['**/*.ts'],
    languageOptions: {
      parser: tsParser,
      parserOptions: { ecmaVersion: 'latest', sourceType: 'module' },
      globals: { console: 'readonly', process: 'readonly', structuredClone: 'readonly' },
    },
    plugins: { '@typescript-eslint': tseslint },
    rules: { ...tseslint.configs.recommended.rules, '@typescript-eslint/no-explicit-any': 'off' },
  },
  prettier,
];
