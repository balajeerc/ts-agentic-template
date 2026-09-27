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

- `pnpm check` runs typecheck, lint, unused-code, duplication, dependency rules and tests.
- If it returns errors or warnings, fix them.
- Do not use eslint-disable to silence a check. Make a genuine effort to fix the issue.
- If it reports code duplication, refactor the common code into a shared utility.

## Keep functions and modules small and simple

- Extract as much logic as possible into pure functions in their own files.
- For a module `myThing.ts`, put its pure helpers in `myThing.utils.ts`.
- Abstract complex behaviour into named helpers rather than inlining it.
- If a function or module is over 120 lines, it is probably time to refactor.
- The lint config enforces the outer bounds: 500 lines per file, complexity 10,
  max depth 3, max 5 params. Treat those as the wall, not the target.

## Types

- `strict` is on. Do not widen it to make an error go away.
- No `any`, no non-null assertions, no unsafe member access — all are lint errors.
- Prefer a discriminated union over a bag of optional fields.

## Tests

- Unit tests live beside the code as `*.test.ts` and must be hermetic.
- Tests that need a real external service are `*.integration.test.ts` — excluded
  from the default suite, given their own config and script when the project
  grows some.
