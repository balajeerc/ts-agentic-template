# ts-agentic-template

A starting point for a TypeScript project that will be worked on with coding
agents. It carries the dev tooling, the lint/check pipeline, and the agent
rules and skills — and almost no application code.

## What's in it

### Dev tooling

| Tool                   | Role                                                                                |
| ---------------------- | ----------------------------------------------------------------------------------- |
| **TypeScript**         | `strict` + `noUncheckedIndexedAccess` + `exactOptionalPropertyTypes`, ES2022        |
| **Vitest**             | `*.test.ts` beside the code; coverage thresholds; `*.integration.test.ts` held back |
| **ESLint**             | typescript-eslint `strict-type-checked`, sonarjs, unicorn, + complexity/size caps   |
| **Prettier**           | formatting, checked in CI; `eslint-config-prettier` keeps the two from fighting     |
| **knip**               | unused files, exports and dependencies — in both default and production mode        |
| **jscpd**              | copy-paste detection at a 0% threshold                                              |
| **dependency-cruiser** | circular imports, orphans, and your module boundaries                               |
| **zod**                | `src/env.ts` — the environment, parsed and validated at boot                        |
| **pino**               | `src/logger.ts` — structured logs; `no-console` is a lint error                     |
| **commitlint**         | Conventional Commits, on `commit-msg` and on PRs                                    |
| **husky**              | `pre-commit` runs the whole `pnpm check`                                            |
| **GitHub Actions**     | the real gate — a hook is bypassable with `--no-verify`, CI is not                  |
| **pnpm**               | with supply-chain guards in `pnpm-workspace.yaml` (see below)                       |

### Agent setup

```
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
└── code-audit/         # structural audit: naming, placement, cohesion
```

Edit `agent_rules/` only. The three other paths are symlinks to it.

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

| Command                    | What it does                                                     |
| -------------------------- | ---------------------------------------------------------------- |
| `pnpm check`               | the gate — typecheck, format, lint, knip, jscpd, depcruise, test |
| `pnpm fix`                 | ESLint autofix + Prettier write. Run this before reading errors. |
| `pnpm typecheck`           | `tsc --noEmit`                                                   |
| `pnpm lint`                | ESLint, `--max-warnings=0`                                       |
| `pnpm format`              | Prettier, writes                                                 |
| `pnpm test` / `test:watch` | Vitest                                                           |
| `pnpm test:coverage`       | Vitest with thresholds enforced                                  |
| `pnpm build`               | emits `dist/` with declarations                                  |
| `pnpm hooks:install`       | installs the husky git hooks (needed after a fresh clone)        |

`pnpm check` is also the `pre-commit` hook, and CI runs it on every push and PR.

## Conventions worth knowing

- **`pnpm`, never `npm`.** The lockfile and the supply-chain guards assume it.
- **Install with scripts off** — `pnpm install --ignore-scripts`. A dependency's
  install script is arbitrary code running as you, with your home directory in
  reach. Packages that genuinely need a build step go in
  `pnpm-workspace.yaml`'s `allowBuilds`, one at a time, after you look at what
  the step does.
- **Read config from `env`, never `process.env`.** `src/env.ts` validates it
  once at boot, so a missing variable fails there instead of mid-request.
- **Use `logger`, never `console`.** Console output has no level, no structure
  and no timestamp, which makes it useless once logs are aggregated.
- **Pure helpers live in `<name>.utils.ts`** beside their consumer.
- **Prettier owns line length** (100 columns, `.prettierrc`). There is
  deliberately no ESLint `max-len`; `eslint-config-prettier` disables it, so one
  added back would be dead config that reads as enforced.
- **Functions cap at 120 lines** (`max-lines-per-function`), which is the norm
  `agent_rules/02` states. Off in test files, where a `describe` block counts as
  one function body.
- **The other lint caps are the wall, not the target**: 500 lines/file,
  complexity 10, max depth 3, max 5 params, 70 statements.
- **Don't silence a check with eslint-disable.** Fix the thing, or change the
  rule deliberately and say why.

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

Dependabot's `cooldown` is set to 30 days to match, so it does not open PRs the
installer will refuse.

## Removing what you don't want

Everything is independent:

- Don't want duplication checks? Drop `check:code-duplication` from `check` and
  remove `jscpd`.
- Don't want the pre-commit hook? Delete `.husky/` and the `prepare` script.
- Don't want Conventional Commits? Delete `commitlint.config.js`,
  `.husky/commit-msg`, and the commitlint step in CI.
- Only using one assistant? Delete the other two rule symlinks.
- Finding `strict-type-checked` too noisy for your codebase? Swap it for
  `recommended-type-checked` in `eslint.config.js`.
