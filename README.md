# ts-agentic-template

A starting point for a TypeScript project that will be worked on with coding
agents. It carries the dev tooling, the lint/check pipeline, and the agent
rules and skills — and almost no application code.

## What's in it

### Dev tooling

| Tool                      | Role                                                                                                  |
| ------------------------- | ----------------------------------------------------------------------------------------------------- |
| **TypeScript**            | `strict` + `noUncheckedIndexedAccess` + `exactOptionalPropertyTypes` + `verbatimModuleSyntax`, ES2022 |
| **Vitest**                | `*.test.ts` beside the code; coverage thresholds; `*.integration.test.ts` held back                   |
| **Stryker**               | mutation testing — asks whether a test would have _failed_, not just whether it ran the line          |
| **@vitest/eslint-plugin** | lints the tests themselves: no assertion, focused, disabled, conditional `expect`                     |
| **ESLint**                | typescript-eslint `strict-type-checked`, sonarjs, unicorn, perfectionist, n, promise + caps           |
| **Prettier**              | formatting, checked by the gate; `eslint-config-prettier` keeps the two from fighting                 |
| **knip**                  | unused files, exports and dependencies — in both default and production mode                          |
| **jscpd**                 | copy-paste detection at a 0% threshold                                                                |
| **dependency-cruiser**    | circular imports, orphans, and your module boundaries                                                 |
| **zod**                   | `src/env.ts` — the environment, parsed and validated at boot                                          |
| **pino**                  | `src/logger.ts` — structured logs; `no-console` is a lint error                                       |
| **commitlint**            | Conventional Commits, on `commit-msg`                                                                 |
| **husky**                 | `pre-commit` runs `pnpm check`; `pre-push` runs the slow half                                         |
| **gitleaks**              | secret scan over the whole history, pinned and checksum-verified, on `pre-push`                       |
| **pnpm audit**            | lockfile vulnerabilities on `pre-push`, with a reviewed ignore list                                   |
| **pnpm**                  | with supply-chain guards in `pnpm-workspace.yaml` (see below)                                         |

### Agent setup

```
AGENTS.md               # cross-tool entry point; a pointer, guarded by a test
agent_rules/            # the rules — the one real copy
├── 01-overview.md          what this project is (fill in)
├── 02-coding-guidelines.md house style + the pnpm check rule
├── 03-code-walkthrough.md  the map agents navigate by
└── 04-committing.md        commit message conventions

.claude/rules  -> agent_rules   # symlinks, so every assistant reads one file
.clinerules    -> agent_rules
.kilocode/rules-> agent_rules

.claude/settings.json   # a read-only-command allowlist, to cut permission prompts
.claude/hooks/
└── format-edited-file.sh   # PostToolUse: eslint --fix + prettier, per edit
.claude/skills/
├── code-audit/         # structural audit: naming, placement, cohesion
├── add-dependency/     # the star check, the maturity window, scripts off
└── write-tests/        # house test conventions, and surviving mutation
```

Edit `agent_rules/` only. The three rule paths are symlinks to it.

`AGENTS.md` is the exception: a file cannot symlink to a directory, so it is a
hand-written pointer at `agent_rules/`. `src/driftGuard.test.ts` asserts it
still names every rule file and no others.

**The edit-time hook is the highest-leverage piece here.** `pnpm check` reports
mechanical problems only once a task is finished, by which point the fix is a
diff across many files competing for attention with real findings. Fixing
formatting and autofixable lint at the moment of the edit keeps `pnpm check`'s
output about things that need judgement.

## Getting started

```bash
pnpm install --ignore-scripts
pnpm hooks:install   # see below — `--ignore-scripts` skips `prepare`
pnpm check
```

`pnpm hooks:install` is a separate step on purpose. Husky installs itself from
the `prepare` lifecycle script, and `--ignore-scripts` — which is the right way
to install — skips `prepare` along with everything else. Without that second
line the `pre-commit` and `commit-msg` hooks are present as files but never
run, and `git config core.hooksPath` is unset. That is the symptom to check for
if a commit sails through with a failing `pnpm check`.

Then:

1. Set `name` in `package.json`.
2. Fill in `agent_rules/01-overview.md` — what this project is.
3. Keep `agent_rules/03-code-walkthrough.md` current as the code appears.
4. Add your module boundaries to Section 2 of `.dependency-cruiser.cjs`.
5. Put your real variables in `src/env.ts` and `sample.env`.
6. Replace `src/index.ts`.

## Commands

| Command                      | What it does                                                     |
| ---------------------------- | ---------------------------------------------------------------- |
| `pnpm check`                 | the gate — typecheck, format, lint, knip, jscpd, depcruise, test |
| `pnpm fix`                   | ESLint autofix + Prettier write. Run this before reading errors. |
| `pnpm typecheck`             | `tsc --noEmit`                                                   |
| `pnpm lint`                  | ESLint, `--max-warnings=0`                                       |
| `pnpm format`                | Prettier, writes                                                 |
| `pnpm test` / `test:watch`   | Vitest                                                           |
| `pnpm test:coverage`         | Vitest with thresholds enforced                                  |
| `pnpm test:mutation`         | Stryker — mutation score, gated by `stryker.conf.mjs`            |
| `pnpm build`                 | emits `dist/` with declarations                                  |
| `pnpm check:vulnerabilities` | `pnpm audit`, with the reviewed ignore list applied              |
| `pnpm scan:secrets`          | gitleaks over the whole git history                              |
| `pnpm hooks:install`         | installs the husky git hooks (needed after a fresh clone)        |
| `pnpm tools:install`         | downloads the pinned gitleaks binary into `.tools/`              |

### The gate is two git hooks

There is no CI. The whole gate is local:

| Hook         | Runs                                                       |
| ------------ | ---------------------------------------------------------- |
| `commit-msg` | commitlint                                                 |
| `pre-commit` | `pnpm check` — the entire thing, not a staged-files subset |
| `pre-push`   | secret scan, dependency audit, build, mutation tests       |

**Both hooks are bypassable.** `git commit --no-verify` and
`git push --no-verify` walk straight past them, and nothing downstream will
notice. This is a gate you choose to keep, not one imposed on you — worth
knowing before trusting a green branch you did not watch go green.

Two commands are needed once after a fresh clone, because `--ignore-scripts`
skips the `prepare` script and gitleaks is not an npm package:

```bash
pnpm hooks:install
pnpm tools:install
```

`pnpm test:mutation` is deliberately **not** in `pnpm check` — a mutation run
scales with suite size in a way a commit gate cannot absorb. `pre-push` is
where it runs.

### Verifying the verification

Three of the guards here exist for the failure mode specific to agentic coding:
output that looks verified without being verified.

- **Mutation testing** answers the question coverage cannot. Coverage says the
  line ran. Stryker changes the line and checks whether anything fails. A
  surviving mutant is a missing assertion.
- **The vitest ESLint plugin** catches the tests that pass by construction — no
  assertion at all, `it.only` parking the rest of the suite, an `expect` behind
  an `if` that the fixture never takes. None of that shows up in a test run.
- **`src/driftGuard.test.ts`** turns the "change these two together" rules into
  assertions: `src/env.ts` against `sample.env`, `src/` against the walkthrough's
  module map, the agent-rule mirrors against `agent_rules/`. Those rules are
  prose, and prose fails silently.

## Every opinionated choice in here

None of this is a default. Each line is a position someone took, and each one
can be reversed — see _Removing what you don't want_.

### Package management

- **`pnpm`, never `npm` or `yarn`.** The lockfile and every supply-chain guard
  assume it.
- **Installs run with `--ignore-scripts`.** A dependency's install script is
  arbitrary code running as you, with your home directory — and every
  credential in it — in reach.
- **A package that genuinely needs its build step is allowlisted one at a
  time**, in `allowBuilds`, after someone looks at what the step does.
- **New dependencies need ≥2,000 GitHub stars**, or `eslint-community`
  maintenance, or first-party status under a project that clears the bar on its
  own. Below that: stop, report the count, ask. Granted exceptions are written
  down in `agent_rules/02-coding-guidelines.md`, not just granted.
- **Nothing published in the last 30 days.** Range a new dependency at the
  newest _matured_ version and let it drift upward on its own.
- **Third-party binaries are pinned and checksum-verified**, never `curl | sh`
  against a moving `latest`. `scripts/installGitleaks.sh` is the pattern.
- **Vulnerability exceptions are per-advisory and reasoned**, in
  `auditConfig.ignoreGhsas` — not a lowered severity threshold.

### Types

- **`strict`, and then some**: `noUncheckedIndexedAccess`,
  `exactOptionalPropertyTypes`, `noImplicitOverride`, `noUnusedLocals`,
  `noUnusedParameters`, `noImplicitReturns`, `noFallthroughCasesInSwitch`.
- **`noUncheckedIndexedAccess` is the highest-value one.** `arr[0]` is
  `T | undefined`, and since non-null assertions are a lint error, the fix has
  to be a real guard rather than an assertion.
- **`verbatimModuleSyntax`** makes `import { type Foo }` a compile requirement
  rather than a lint preference, so `tsc` alone catches it.
- **`noUncheckedSideEffectImports`** so a typo'd `import './setup'` fails at
  compile time instead of on the machine that runs it.
- **`moduleDetection: "force"`** — every file is a module, whether or not it
  happens to export anything today.
- **No `any`, no non-null assertions, no unsafe member access.** All errors.
- **Discriminated unions over bags of optional fields**, and a `switch` over a
  union must be exhaustive. Adding a variant should break the build everywhere.

### Lint and format

- **Prettier owns formatting; ESLint never does.** 100 columns. There is
  deliberately no `max-len` — `eslint-config-prettier` would disable it, so
  adding one back produces dead config that reads as enforced.
- **typescript-eslint `strict-type-checked` + `stylistic-type-checked`**, plus
  sonarjs, unicorn, perfectionist, n and promise.
- **Perfectionist sorts imports, exports and type members — not objects.**
  Object-literal and class-member order is usually meaningful; sorting it fights
  the author.
- **The caps are the wall, not the target**: 120 lines per function, 500 per
  file, complexity 10, depth 3, 5 params, 70 statements.
- **`console` is an error.** `logger` is the way out.
- **`process.env` is an error everywhere except `src/env.ts`**, the file whose
  whole job is to parse it.
- **Deferrals carry a date.** `// TODO [2026-12-01]: ...`. `sonarjs/todo-tag` is
  off on purpose — it bans the marker outright, leaving no form of the comment
  that passes, so the only ways through are deleting the note or disabling a
  rule.
- **No `eslint-disable` to silence a finding.** Fix it, or change the rule
  deliberately and say why.
- **`--max-warnings=0`.** A warning is a failure; the severity only changes the
  wording.

### Tests

- **Unit tests sit beside the code** as `*.test.ts`, and must be hermetic.
- **Integration tests are a separate suite**, `*.integration.test.ts`, excluded
  from the default run.
- **Coverage has a floor and it is a ratchet.** It only goes up. Deleting or
  skipping a test to reach it fails the gate instead.
- **Mutation testing is a gate too.** Coverage says the line ran; Stryker
  changes the line and asks whether anything would have failed.
- **The tests themselves are linted.** No-assertion tests, `it.only`, `it.skip`,
  an `expect` behind an `if`, duplicate titles — all errors, because none of
  them show up in a test run.
- **An unkillable mutant is a design signal**, not a threshold to lower:
  extract the logic to `*.utils.ts` and test it directly. That is why
  `src/env.utils.ts` exists.

### Structure

- **Pure helpers live in `<name>.utils.ts`** beside their consumer.
- **Dependencies are parameters.** `run(log, name)` takes its logger; only
  `main()` reaches for the module-level singleton.
- **Configuration is parsed once, at boot**, by zod in `src/env.ts`. A bad
  variable fails there, naming itself, rather than mid-request.
- **Logs are newline-delimited JSON in production.** `pino-pretty` is a
  devDependency and must never be reachable on the production path.

### Documentation and agents

- **`agent_rules/` is the one real copy.** `.claude/rules`, `.clinerules` and
  `.kilocode/rules` are symlinks to it; `AGENTS.md` is a pointer at it. Never
  edit a mirror.
- **The walkthrough is enforced, not aspirational.** A file under `src/` that is
  missing from its module map fails a test.
- **Numbers quoted in the rules are checked against the configs that hold
  them**, so prose and config cannot drift apart while both read authoritative.
- **Procedures are skills, not paragraphs.** `add-dependency` and `write-tests`
  encode what would otherwise be prose an agent skims once.

### Process

- **Conventional Commits**, enforced on `commit-msg`.
- **`pre-commit` runs the entire `pnpm check`**, not a staged-files subset. The
  edit-time hook is what keeps that from being slow to act on.
- **`pre-push` runs the slow half**: secret scan, dependency audit, build,
  mutation tests.
- **There is no CI, and both hooks are bypassable.** That is a deliberate trade
  for a template meant to be cloned into environments that may not have a
  runner — not an oversight. Wiring `pnpm check` and the `pre-push` list into
  whatever runner you have is the one thing worth adding back.

### Deliberately not here

- **Biome / oxc** — faster, but the type-aware lint rules are the whole point.
- **lint-staged** — the gate is the whole check, not the changed files.
- **`eslint-plugin-jsdoc`** — the house comment style is prose-in-header, not
  API docs. Enforcing JSDoc syntax would fight it.
- **markdownlint, cspell, `eslint-plugin-regexp`** — all considered, all below
  the star bar, none earning an exception.
- **`publint` / `@arethetypeswrong/cli`** — add when the project publishes.

## Supply-chain guards

They live in `pnpm-workspace.yaml`, **not** `.npmrc`. pnpm 10.16+ moved its own
settings out of `.npmrc`, and a key left there is silently ignored — the guard
you think you have is not there. `pnpm config list` is how you confirm a
setting is live.

| Setting               | Effect                                                           |
| --------------------- | ---------------------------------------------------------------- |
| `minimumReleaseAge`   | refuse releases under 30 days old (value is in **minutes**)      |
| `blockExoticSubdeps`  | transitive deps must come from the registry, not git or tarballs |
| `trustPolicy`         | refuse an update whose publisher trust level dropped             |
| `trustPolicyExclude`  | reviewed exceptions, pinned to an exact version                  |
| `verifyDepsBeforeRun` | warn when `node_modules` drifts from the lockfile                |
| `allowBuilds`         | the only packages permitted to run install scripts               |

Two consequences to plan around:

- `minimumReleaseAge` constrains **resolution**, not just verification. A
  `^x.y.z` range pinned to a release from this week has no mature version to
  fall back to, and the install fails outright. Range a new dependency at the
  newest **matured** version and let it drift upward on its own.
- `trustPolicy: no-downgrade` fires on transitive deps you did not choose.
  `trustPolicyExclude` is the escape hatch, and each entry is pinned to an exact
  version so the next release has to be re-reviewed. Do not grow that list just
  to make an install pass.

| `auditConfig` | advisories `pnpm audit` has been told to ignore, each one reviewed |

There is no Dependabot. `pnpm outdated` is the manual equivalent; anything it
proposes still has to clear the 30-day window and the star bar.

## Removing what you don't want

Everything is independent:

- Don't want duplication checks? Drop `check:code-duplication` from `check` and
  remove `jscpd`.
- Don't want the pre-commit hook? Delete `.husky/` and the `prepare` script.
- Don't want Conventional Commits? Delete `commitlint.config.js` and
  `.husky/commit-msg`.
- Only using one assistant? Delete the other two rule symlinks.
- Finding `strict-type-checked` too noisy for your codebase? Swap it for
  `recommended-type-checked` in `eslint.config.js`.
- Mutation testing too slow once the suite grows? Drop it from `.husky/pre-push`
  and run `pnpm test:mutation` on a schedule instead. Occasional runs still
  recalibrate the suite; deleting it entirely does not.
- Don't want a local secret scan? Delete `.husky/pre-push`, `scan:secrets`,
  `tools:install` and `scripts/installGitleaks.sh`.

## Add when you publish

Nothing here assumes the project ships to a registry. When it does, add
`publint` and `@arethetypeswrong/cli` to `pnpm check` — they catch broken
`exports` maps and type resolution that no test exercises.
