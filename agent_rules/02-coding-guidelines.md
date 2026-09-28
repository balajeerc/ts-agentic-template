# Coding Guidelines

## Keeping the code walkthrough up-to-date

- The code walkthrough lives in `agent_rules/03-code-walkthrough.md`.
- Split it by area (one file per subsystem) once it outgrows a single file.
- When making changes to source code, update the walkthrough for the area you touched.
- When updating a file, check whether the matching walkthrough section is affected — if so, update it.
- **IMPORTANT NOTE**: Only update the files under `agent_rules/`. Other copies
  such as `.claude/rules/`, `.clinerules` and `.kilocode/rules/` are symbolic
  links to the `agent_rules` directory.

## Use `pnpm` instead of `npm`

- This applies to all commands: `pnpm build`, `pnpm test`, `pnpm check`, etc.
- This is especially needed for `pnpm install`.
  - Never run `npm install`. Always use `pnpm` for all package management tasks.

## Always run `pnpm check` before marking a task complete

- `pnpm check` runs typecheck, format, lint, unused-code, duplication,
  dependency rules and tests-with-coverage.
- If it returns errors or warnings, fix them.
- `pnpm fix` clears the mechanical ones — ESLint autofix plus Prettier. Run it
  first, then read what is left.
- Do not use eslint-disable to silence a check. Make a genuine effort to fix the issue.
- If it reports code duplication, refactor the common code into a shared utility.
- Do not lower a coverage threshold to make the gate pass. The threshold is a
  ratchet; it only goes up.

## Keep functions and modules small and simple

- Extract as much logic as possible into pure functions in their own files.
- For a module `myThing.ts`, put its pure helpers in `myThing.utils.ts`.
- Abstract complex behaviour into named helpers rather than inlining it.
- If a function or module is over 120 lines, it is probably time to refactor.
  `max-lines-per-function` enforces this at 120, so it is a rule and not just
  advice. It is off in test files, where a `describe` block counts as one body.
- The lint config enforces the outer bounds: 500 lines per file, complexity 10,
  max depth 3, max 5 params, 70 statements. Treat those as the wall, not the
  target.
- Do not extract a single-use helper purely to get under a cap. A flat, linear
  function is often the honest shape; scattering it across files to satisfy a
  counter reads worse.

## Formatting

- Prettier owns formatting. ESLint does not.
- Line length is 100 columns, set by `printWidth` in `.prettierrc`.
- There is no ESLint `max-len` rule. `eslint-config-prettier` would disable it,
  so adding one back produces dead config that reads as enforced.
- `pnpm check:format` is what fails the gate on unformatted code.

## Types

- `strict` is on. Do not widen it to make an error go away.
- No `any`, no non-null assertions, no unsafe member access — all are lint errors.
- Prefer a discriminated union over a bag of optional fields.
- `switch` over a union must be exhaustive. Adding a variant should break the
  build at every switch, not fall through at runtime.
- `noUncheckedIndexedAccess` is on. `arr[0]` is `T | undefined`. Guard it; do
  not assert it away.
- `exactOptionalPropertyTypes` is on. `{ a?: string }` will not accept an
  explicit `a: undefined`.
- Import types with `import { type Foo }`, not a bare import.

## Configuration and logging

- Read configuration from `env` in `src/env.ts`. Never `process.env` directly.
- Add a new variable to `src/env.ts` and `sample.env` in the same change.
- `console` is a lint error. Use `logger` from `src/logger.ts`.
- Prefer taking a `Logger` as a parameter over importing the singleton.

## Dependencies

- Install with scripts off: `pnpm add --ignore-scripts <package>`.
- After a fresh clone, run `pnpm hooks:install`. `--ignore-scripts` skips the
  `prepare` script that installs husky, so without it the git hooks are inert.
- `minimumReleaseAge` (30 days) constrains **resolution**, not just
  verification. A `^x.y.z` range pinned to a release from this week has no
  mature version to fall back to and the install fails outright.
  - Range a new dependency at the newest **matured** version, and let it drift
    upward on its own.
- Do not add to `trustPolicyExclude` in `pnpm-workspace.yaml` just to make an
  install pass. Each entry is a reviewed exception, pinned to an exact version.
- A package that needs its build step goes in `allowBuilds`, one at a time,
  after looking at what the step does.

## Tests

- Unit tests live beside the code as `*.test.ts` and must be hermetic.
- Tests that need a real external service are `*.integration.test.ts` — excluded
  from the default suite, given their own config and script when the project
  grows some.
- Coverage has a floor, checked by `pnpm check`. Deleting or skipping a test to
  get to green fails the gate instead.
