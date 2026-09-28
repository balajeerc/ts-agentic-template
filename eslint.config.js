import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import sonarjs from 'eslint-plugin-sonarjs';
import unicorn from 'eslint-plugin-unicorn';
import perfectionist from 'eslint-plugin-perfectionist';
import pluginN from 'eslint-plugin-n';
import pluginPromise from 'eslint-plugin-promise';
import eslintConfigPrettier from 'eslint-config-prettier';

/*
 * Line length is NOT enforced here. `eslint-config-prettier` is last in the
 * export and switches `max-len` off, so any cap set here would be dead config
 * that reads as enforced. Prettier's `printWidth` in `.prettierrc` is the one
 * real setting, and `pnpm check:format` is what enforces it.
 */

// `src/env.ts` is the one place `process.env` may be read — it is the file
// whose whole job is to parse and validate it. The ban below targets everything
// else; the `src/env.ts` override at the bottom re-specifies the rule without
// the process.env selector rather than an eslint-disable comment.
const processEnvSelector = {
  selector: "MemberExpression[object.name='process'][property.name='env']",
  message: 'Read configuration from src/env.ts, never process.env directly.',
};

// Left behind by an agent, `it.only` silently disables the rest of the suite;
// `it.skip` rots in place. Neither is ever right to commit.
const focusedTestSelector = {
  selector:
    'CallExpression[callee.object.name=/^(it|test|describe|suite|context)$/][callee.property.name=/^(only|skip)$/]',
  message: 'Remove .only()/.skip() before committing.',
};

const sharedPlugins = {
  '@typescript-eslint': tseslint.plugin,
  sonarjs: sonarjs,
  unicorn: unicorn,
  perfectionist: perfectionist,
  n: pluginN,
  promise: pluginPromise,
};

const sharedTypeScriptRules = {
  ...sonarjs.configs.recommended.rules,
  ...pluginPromise.configs.recommended.rules,

  // Deterministic ordering, curated. Import/export/type-member order is what
  // makes an agent's output diff-reviewable — the same import set should always
  // sort the same way regardless of which agent (or which day) wrote it.
  //
  // Object-literal and class-member order is often *meaningful* (a config
  // builder reads top to bottom, a class body is written in an intentional
  // order), so perfectionist's `sort-objects` / `sort-maps` / `sort-classes`
  // and friends are deliberately left off. Sorting those fights the author.
  'perfectionist/sort-imports': [
    'error',
    {
      type: 'natural',
      internalPattern: ['^@/'],
      groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index', 'type', 'unknown'],
      ignoreCase: true,
    },
  ],
  'perfectionist/sort-named-imports': ['error', { type: 'natural', ignoreAlias: false }],
  'perfectionist/sort-named-exports': ['error', { type: 'natural' }],
  'perfectionist/sort-exports': ['error', { type: 'natural' }],
  'perfectionist/sort-union-types': ['error', { type: 'natural' }],
  'perfectionist/sort-intersection-types': ['error', { type: 'natural' }],
  'perfectionist/sort-object-types': ['error', { type: 'natural' }],
  'perfectionist/sort-heritage-clauses': ['error', { type: 'natural' }],
  'perfectionist/sort-interfaces': ['error', { type: 'natural' }],

  // Node API correctness (eslint-plugin-n), curated. The module-resolution
  // rules (`no-extraneous-import`, `no-missing-import`, `no-unpublished-*`)
  // are left off: they do not understand the `@/*` tsconfig path alias and
  // tsc + knip already cover missing imports and unused deps respectively.
  'n/no-deprecated-api': 'error',
  'n/no-exports-assign': 'error',
  'n/no-process-exit': 'error',
  'n/process-exit-as-throw': 'error',
  'n/hashbang': 'error',
  'n/no-unsupported-features/es-builtins': 'error',
  'n/no-unsupported-features/es-syntax': 'error',
  'n/no-unsupported-features/node-builtins': 'error',

  // `.then` chains are harder to read, reason about and error-handle than
  // `await`. Core rules already ban async executors; this bans the rest.
  'promise/prefer-await-to-then': 'error',
  'no-promise-executor-return': 'error',

  // The `process.env` convention in `agent_rules/02` and `src/env.ts`, made
  // mechanical. `process.env.X` is `string | undefined` and reading it outside
  // `env.ts` pushes the failure far from the boot-time validation that exists
  // to catch it. Also bans focused/disabled tests (see the selectors above).
  'no-restricted-syntax': ['error', processEnvSelector, focusedTestSelector],

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

  // TypeScript rules not already covered by strict-type-checked
  '@typescript-eslint/no-unused-vars': [
    'error',
    {
      varsIgnorePattern: '^[A-Z_]',
      argsIgnorePattern: '^_',
    },
  ],
  '@typescript-eslint/explicit-function-return-type': 'error',
  '@typescript-eslint/explicit-module-boundary-types': 'error',
  '@typescript-eslint/prefer-readonly': 'error',
  // Adding a variant to a discriminated union becomes a compile-time failure at
  // every switch over it, rather than a silent fallthrough at runtime.
  '@typescript-eslint/switch-exhaustiveness-check': [
    'error',
    { considerDefaultExhaustiveForUnions: true },
  ],
  // Type-only imports are erased predictably under `isolatedModules`.
  '@typescript-eslint/consistent-type-imports': [
    'error',
    { fixStyle: 'inline-type-imports', prefer: 'type-imports' },
  ],

  // Use the logger in `src/logger.ts`. Console output is unstructured, unleveled
  // and invisible to log aggregation.
  'no-console': 'error',

  // Complexity rules
  complexity: ['error', { max: 10 }],
  'max-depth': ['error', { max: 3 }],
  'max-nested-callbacks': ['error', { max: 3 }],
  'max-params': ['error', { max: 5 }],
  'max-lines': ['error', { max: 500, skipBlankLines: true, skipComments: true }],

  /*
   * The cap that matters, and the one stated in `agent_rules/02`: refactor a
   * function over 120 lines. It is expressed in lines rather than statements on
   * purpose — that is the unit the guideline uses, so it is the unit someone can
   * act on when the rule fires.
   */
  'max-lines-per-function': ['error', { max: 120, skipBlankLines: true, skipComments: true }],

  /*
   * A backstop for the pathological case, deliberately far out at 70.
   *
   * This is the only size rule that fires on code which is long but NOT complex
   * — a flat sequence of assignments in a config builder or a wiring function
   * has cyclomatic complexity 1 and trips nothing else. Tightening it pushes
   * toward single-use helpers that scatter a linear narrative across files,
   * which reads worse than the long version. `complexity`,
   * `sonarjs/cognitive-complexity` and `max-lines-per-function` are what do the
   * real work here.
   */
  'max-statements': ['error', { max: 70 }, { ignoreTopLevelFunctions: false }],
};

export default tseslint.config(
  {
    ignores: ['dist', 'node_modules', 'coverage'],
  },
  // TypeScript sources. `**/*.ts` rather than a src/scripts allowlist so that a
  // root-level config file (vitest.config.ts) is linted too, and `projectService`
  // rather than a fixed `project` so a new file is type-checked without anyone
  // remembering to widen a glob.
  //
  // `tseslint.config()` (the `typescript-eslint` meta-package) replaces the old
  // hand-assembled plugin + parser + `configs['eslint-recommended'].overrides[0]`
  // wiring. `strictTypeChecked` already bundles the base setup and the
  // eslint-recommended turn-offs, so there is no internal array index to break
  // on a dependency bump.
  {
    files: ['**/*.ts'],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.node,
      parser: tseslint.parser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: { ...sharedPlugins },
    extends: [
      js.configs.recommended,
      ...tseslint.configs.strictTypeChecked,
      ...tseslint.configs.stylisticTypeChecked,
    ],
    rules: { ...sharedTypeScriptRules },
  },
  // `process.env` may be read here and only here. Re-specifying the rule with
  // the test selector only keeps the `.only`/`.skip` ban, without an
  // eslint-disable comment.
  {
    files: ['src/env.ts'],
    rules: {
      'no-restricted-syntax': ['error', focusedTestSelector],
    },
  },
  // Tests. The production rules stay on; these are the ones that only cost
  // noise in a test file.
  {
    files: ['**/*.test.ts', '**/*.integration.test.ts'],
    rules: {
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
      'max-nested-callbacks': ['error', { max: 5 }],
      'sonarjs/no-duplicate-string': 'off',
      // A `describe` block is itself a function, so this counts the whole suite
      // as one body. `max-lines` still caps the file at 500.
      'max-lines-per-function': 'off',
    },
  },
  // Plain JS / config files — no type-aware rules, so no project service needed.
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
      n: pluginN,
      promise: pluginPromise,
    },
    rules: {
      ...js.configs.recommended.rules,
      ...sonarjs.configs.recommended.rules,
      ...pluginPromise.configs.recommended.rules,
      'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]' }],

      'n/no-deprecated-api': 'error',
      'n/no-exports-assign': 'error',
      'n/no-process-exit': 'error',
      'n/process-exit-as-throw': 'error',
      'n/hashbang': 'error',
      'promise/prefer-await-to-then': 'error',
      'no-promise-executor-return': 'error',

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
    },
  },
  eslintConfigPrettier
);
