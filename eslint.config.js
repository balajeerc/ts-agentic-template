import js from '@eslint/js';
import globals from 'globals';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsparser from '@typescript-eslint/parser';
import sonarjs from 'eslint-plugin-sonarjs';
import unicorn from 'eslint-plugin-unicorn';
import eslintConfigPrettier from 'eslint-config-prettier';

const sharedPlugins = {
  '@typescript-eslint': tseslint,
  sonarjs: sonarjs,
  unicorn: unicorn,
};

const sharedTypeScriptRules = {
  ...js.configs.recommended.rules,
  ...tseslint.configs.recommended.rules,
  ...tseslint.configs['recommended-requiring-type-checking'].rules,
  ...sonarjs.configs.recommended.rules,

  // Unicorn recommended rules (selected for readability)
  'unicorn/better-regex': 'error',
  'unicorn/catch-error-name': 'error',
  'unicorn/consistent-destructuring': 'warn',
  'unicorn/consistent-function-scoping': 'error',
  'unicorn/custom-error-definition': 'error',
  'unicorn/error-message': 'error',
  'unicorn/escape-case': 'error',
  'unicorn/expiring-todo-comments': 'warn',
  'unicorn/explicit-length-check': 'error',
  'unicorn/filename-case': ['error', { case: 'camelCase', ignore: ['^[A-Z].*\\.tsx?$'] }],
  'unicorn/no-abusive-eslint-disable': 'error',
  'unicorn/no-array-for-each': 'warn',
  'unicorn/no-array-push-push': 'error',
  'unicorn/no-await-expression-member': 'error',
  'unicorn/no-console-spaces': 'error',
  'unicorn/no-for-loop': 'warn',
  'unicorn/no-lonely-if': 'error',
  'unicorn/no-nested-ternary': 'warn',
  'unicorn/no-null': 'off',
  'unicorn/no-useless-undefined': 'error',
  'unicorn/number-literal-case': 'error',
  'unicorn/prefer-array-find': 'error',
  'unicorn/prefer-array-flat-map': 'error',
  'unicorn/prefer-array-some': 'error',
  'unicorn/prefer-date-now': 'error',
  'unicorn/prefer-default-parameters': 'error',
  'unicorn/prefer-includes': 'error',
  'unicorn/prefer-modern-math-apis': 'error',
  'unicorn/prefer-negative-index': 'error',
  'unicorn/prefer-node-protocol': 'error',
  'unicorn/prefer-number-properties': 'error',
  'unicorn/prefer-optional-catch-binding': 'error',
  'unicorn/prefer-spread': 'error',
  'unicorn/prefer-string-starts-ends-with': 'error',
  'unicorn/prefer-switch': 'warn',
  'unicorn/prefer-ternary': 'warn',
  'unicorn/prefer-type-error': 'error',
  'unicorn/throw-new-error': 'error',

  // SonarJS rule adjustments
  'sonarjs/redundant-type-aliases': 'off', // Type aliases provide semantic meaning
  'sonarjs/cognitive-complexity': 'error',
  'sonarjs/no-nested-functions': 'error',

  // TypeScript specific rules
  '@typescript-eslint/no-unused-vars': [
    'error',
    {
      varsIgnorePattern: '^[A-Z_]',
      argsIgnorePattern: '^_',
    },
  ],
  '@typescript-eslint/explicit-function-return-type': 'error',
  '@typescript-eslint/explicit-module-boundary-types': 'error',
  '@typescript-eslint/no-explicit-any': 'error',
  '@typescript-eslint/no-non-null-assertion': 'error',
  '@typescript-eslint/no-unsafe-assignment': 'error',
  '@typescript-eslint/no-unsafe-member-access': 'error',
  '@typescript-eslint/no-unsafe-call': 'error',
  '@typescript-eslint/no-unsafe-argument': 'error',
  '@typescript-eslint/no-unsafe-return': 'error',
  '@typescript-eslint/no-misused-promises': 'error',
  '@typescript-eslint/no-redundant-type-constituents': 'error',
  '@typescript-eslint/no-unnecessary-type-assertion': 'error',

  // Complexity rules
  complexity: ['error', { max: 10 }],
  'max-depth': ['error', { max: 3 }],
  'max-nested-callbacks': ['error', { max: 3 }],
  'max-params': ['error', { max: 5 }],
  'max-statements': ['error', { max: 70 }, { ignoreTopLevelFunctions: false }],
  'max-lines': ['error', { max: 500, skipBlankLines: true, skipComments: true }],

  // Line length
  'max-len': [
    'error',
    {
      code: 120,
      tabWidth: 2,
      ignoreUrls: true,
      ignoreStrings: true,
      ignoreTemplateLiterals: true,
      ignoreRegExpLiterals: true,
      ignoreComments: true,
    },
  ],
};

export default [
  {
    ignores: ['dist', 'node_modules', 'coverage'],
  },
  // TypeScript sources
  {
    files: ['src/**/*.ts', 'scripts/**/*.ts'],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.node,
      parser: tsparser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        project: './tsconfig.json',
      },
    },
    plugins: { ...sharedPlugins },
    rules: { ...sharedTypeScriptRules },
  },
  // Plain JS / config files — no type-aware rules, so no `project` needed.
  {
    files: ['**/*.{js,mjs,cjs}'],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.node,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
    },
    plugins: {
      sonarjs: sonarjs,
      unicorn: unicorn,
    },
    rules: {
      ...js.configs.recommended.rules,
      ...sonarjs.configs.recommended.rules,
      'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]' }],

      'unicorn/better-regex': 'error',
      'unicorn/catch-error-name': 'error',
      'unicorn/error-message': 'error',
      'unicorn/escape-case': 'error',
      'unicorn/explicit-length-check': 'error',
      'unicorn/filename-case': ['error', { case: 'camelCase', ignore: ['^[A-Z].*\\.jsx?$'] }],
      'unicorn/no-abusive-eslint-disable': 'error',
      'unicorn/no-array-push-push': 'error',
      'unicorn/no-console-spaces': 'error',
      'unicorn/no-lonely-if': 'error',
      'unicorn/no-null': 'off',
      'unicorn/no-useless-undefined': 'error',
      'unicorn/number-literal-case': 'error',
      'unicorn/prefer-array-find': 'error',
      'unicorn/prefer-array-some': 'error',
      'unicorn/prefer-includes': 'error',
      'unicorn/prefer-node-protocol': 'error',
      'unicorn/prefer-spread': 'error',
      'unicorn/prefer-string-starts-ends-with': 'error',
      'unicorn/throw-new-error': 'error',

      complexity: ['error', { max: 10 }],
      'max-depth': ['error', { max: 3 }],
      'max-len': [
        'error',
        {
          code: 120,
          tabWidth: 2,
          ignoreUrls: true,
          ignoreStrings: true,
          ignoreTemplateLiterals: true,
        },
      ],
    },
  },
  eslintConfigPrettier,
];
