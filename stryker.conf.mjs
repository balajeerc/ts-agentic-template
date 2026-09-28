/*
 * Mutation testing.
 *
 * Coverage answers "was this line executed by a test". It does not answer "would
 * a test have failed if the line were wrong" — and those come apart badly under
 * agentic coding, where a test that calls the code and asserts nothing useful is
 * cheap to produce and looks green. Stryker rewrites the source one small change
 * at a time (`>` becomes `>=`, a string becomes `""`, a branch is removed) and
 * reruns the suite. A mutant that survives is a line the suite does not actually
 * pin down.
 *
 * Read a survivor as a missing assertion, not as a line to delete.
 *
 * Deliberately NOT part of `pnpm check`: that runs on every commit via the
 * pre-commit hook, and a full mutation run scales with suite size in a way a
 * commit gate cannot absorb. The `pre-push` hook is where it runs.
 */

/** @type {import('@stryker-mutator/api/core').PartialStrykerOptions} */
export default {
  packageManager: 'pnpm',

  /*
   * Stryker copies the project into a sandbox before mutating it, and a copy
   * chokes on a symlink that points at a directory. `.claude/rules`,
   * `.clinerules` and `.kilocode/rules` are exactly that — mirrors of
   * `agent_rules/`. Nothing under them is mutated or read by a test, so keep
   * them out of the sandbox entirely. `agent_rules/` itself stays: the drift
   * guard in `src/driftGuard.test.ts` reads the walkthrough out of it.
   */
  ignorePatterns: ['.claude', '.clinerules', '.kilocode'],
  testRunner: 'vitest',
  // Named explicitly rather than left to the default `@stryker-mutator/*` glob:
  // under pnpm's non-flat `node_modules` that glob finds nothing, and the run
  // dies with "no TestRunner plugins were loaded".
  plugins: ['@stryker-mutator/vitest-runner'],
  vitest: { configFile: 'vitest.config.ts' },

  /*
   * The same set of files `vitest.config.ts` measures coverage on, and for the
   * same reason. Two different notions of "code that must be tested" drift apart
   * the moment one of them is edited; keep these lists in step.
   */
  mutate: [
    'src/**/*.ts',
    '!src/**/*.test.ts',
    '!src/**/*.integration.test.ts',
    '!src/**/__fixtures__/**',
    '!src/index.ts',
    '!src/logger.ts',
  ],

  // Run each mutant only against the tests that actually covered the mutated
  // line. Without this every mutant reruns the whole suite.
  coverageAnalysis: 'perTest',

  /*
   * `break` is the gate: below this, the run exits non-zero. A floor, not a
   * target — the same ratchet as the coverage thresholds, and it only goes up.
   * `high`/`low` are colouring in the report and gate nothing.
   *
   * The template ships at 100. The floor sits below that on purpose: a mutation
   * score dips for honest reasons mid-refactor, and a gate that fires on every
   * intermediate state is a gate people learn to bypass. Raise it when the score
   * has been steady above the next number for a while.
   */
  thresholds: { high: 100, low: 90, break: 90 },

  reporters: ['progress', 'clear-text', 'html'],
  htmlReporter: { fileName: 'reports/mutation/index.html' },

  // Survivors are the point of the run; without this the summary truncates the
  // list and the interesting ones are the ones that get cut.
  clearTextReporter: { maxTestsToLog: 0, allowColor: true },

  // Mutants in code that only ever runs once at import time cannot be killed by
  // a test that imports the module a second time. Reporting them as survivors is
  // noise about module semantics rather than about the tests.
  ignoreStatic: true,
};
