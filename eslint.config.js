import js from '@eslint/js'
import globals from 'globals'
import tseslint from 'typescript-eslint'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import eslintPluginPrettier from 'eslint-plugin-prettier'
import eslintConfigPrettier from 'eslint-config-prettier'
import importHelpers from 'eslint-plugin-import-helpers'

export default tseslint.config(
  { ignores: ['dist'] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      prettier: eslintPluginPrettier,
      'import-helpers': importHelpers,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],

      // Prettier
      'prettier/prettier': 'error',

      // Estilo
      semi: ['error', 'never'],
      quotes: ['error', 'single'],

      // TypeScript
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'warn',

      // Ordenação de imports
      'import-helpers/order-imports': [
        'warn',
        {
          newlinesBetween: 'always',
          groups: ['/^react/', 'module', '/^@/', ['parent', 'sibling', 'index']],
          alphabetize: { order: 'asc', ignoreCase: true },
        },
      ],
    },
  },
  eslintConfigPrettier // deve ser o último — desativa regras que conflitam com Prettier
)
