// @ts-check

import { configApp } from '@adonisjs/eslint-config'
import js from '@eslint/js'
import prettierConfig from 'eslint-config-prettier'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import simpleImportSort from 'eslint-plugin-simple-import-sort'
import globals from 'globals'
import tseslint from 'typescript-eslint'
import reactCompiler from 'eslint-plugin-react-compiler'

export default configApp(
  js.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,
  react.configs.flat?.recommended,
  react.configs.flat?.['jsx-runtime'],
  {
    settings: { react: { version: '18.3' } },
    plugins: {
      'simple-import-sort': simpleImportSort,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      'react-compiler': reactCompiler,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['error', { allowConstantExport: true }],

      'react/jsx-curly-brace-presence': ['error', 'never'],
      'react/prop-types': 'off',

      'react-compiler/react-compiler': 'error',

      '@typescript-eslint/no-unnecessary-condition': 'off',
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/no-empty-function': 'off',
      '@typescript-eslint/no-misused-promises': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/only-throw-error': 'off',
      '@typescript-eslint/restrict-template-expressions': 'off',
      '@typescript-eslint/require-await': 'off',
      '@typescript-eslint/no-empty-object-type': 'off',
      '@typescript-eslint/no-namespace': [
        'error',
        {
          allowDeclarations: true,
        },
      ],
      'prefer-template': 'error',
      'no-console': ['error'],

      '@unicorn/filename-case': [
        'error',
        {
          cases: {
            kebabCase: true,
            snakeCase: true,
          },
        },
      ],

      'simple-import-sort/imports': 'error',
      'simple-import-sort/exports': 'error',
    },
    languageOptions: {
      ...react.configs.flat?.recommended.languageOptions,
      globals: { ...globals.browser, ...globals.node },
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    ignores: [
      '**/*.config.ts',
      '**/*.{cjs,mjs,js}',
      '**/.adonisjs/**/*.ts',
      '**/dist/**',
      '**/routeTree.gen.ts',
      '**/build/**',
    ],
  },
  prettierConfig
)
