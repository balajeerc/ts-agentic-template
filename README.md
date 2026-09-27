# ts-agentic-template

A starting point for a TypeScript project that will be worked on with coding
agents. It carries the dev tooling, the lint/check pipeline, and the agent
rules and skills — and no application code.

## What's in it

### Dev tooling

| Tool                   | Role                                                                                 |
| ---------------------- | ------------------------------------------------------------------------------------ |
| **TypeScript**         | `strict`, ES2022, `@/*` path alias to `src/`                                         |
| **Vitest**             | `*.test.ts` beside the code; `*.integration.test.ts` excluded from the default suite |
| **ESLint**             | typescript-eslint (type-aware), sonarjs, unicorn, + complexity/size caps             |
| **Prettier**           | formatting only; `eslint-config-prettier` keeps the two from fighting                |
| **knip**               | unused files, exports and dependencies                                               |
| **jscpd**              | copy-paste detection at a 0% threshold                                               |
| **dependency-cruiser** | circular imports, orphans, and your module boundaries                                |
| **husky**              | `pre-commit` runs the whole `pnpm check`                                             |
| **pnpm**               | with supply-chain guards in `.npmrc` (see below)                                     |

### Agent setup

```
agent_rules/            # the rules — the one real copy
├── 01-overview.md          what this project is (fill in)
├── 02-coding-guidelines.md house style + the pnpm check rule
├── 03-code-walkthrough.md  the map agents navigate by (fill in)
└── 04-committing.md        commit message conventions

.claude/rules  -> agent_rules   # symlinks, so every assistant reads one file
.clinerules    -> agent_rules
.kilocode/rules-> agent_rules

.claude/settings.json   # a read-only-command allowlist, to cut permission prompts
.claude/skills/
└── code-audit/         # structural audit: naming, placement, cohesion
```

Edit `agent_rules/` only. The three other paths are symlinks to it.

## Getting started

```bash
pnpm install --ignore-scripts
pnpm check
```

Then:

1. Set `name` in `package.json`.
2. Fill in `agent_rules/01-overview.md` — what this project is.
3. Fill in `agent_rules/03-code-walkthrough.md` as the code appears.
4. Add your module boundaries to Section 2 of `.dependency-cruiser.cjs`.
5. Replace `src/index.ts`.

## Commands

| Command                    | What it does                                                  |
| -------------------------- | ------------------------------------------------------------- |
| `pnpm check`               | typecheck → lint → knip → jscpd → depcruise → test. The gate. |
| `pnpm typecheck`           | `tsc --noEmit`                                                |
| `pnpm lint`                | ESLint, `--max-warnings=0`                                    |
| `pnpm format`              | Prettier, writes                                              |
| `pnpm test` / `test:watch` | Vitest                                                        |
| `pnpm build`               | emits `dist/` with declarations                               |

`pnpm check` is also the `pre-commit` hook, so a commit cannot land red.

## Conventions worth knowing

- **`pnpm`, never `npm`.** The lockfile and `.npmrc` guards assume it.
- **Install with scripts off** — `pnpm install --ignore-scripts`. A dependency's
  install script is arbitrary code running as you, with your home directory in
  reach. Packages that genuinely need a build step go in
  `pnpm-workspace.yaml`'s `allowBuilds`, one at a time, after you look at what
  the step does.
- **`.npmrc` carries supply-chain guards**: a 30-day minimum release age, no
  exotic (git/tarball) transitive sources, and no trust downgrades.
- **Pure helpers live in `<name>.utils.ts`** beside their consumer.
- **The lint caps are the wall, not the target**: 500 lines/file, complexity 10,
  max depth 3, max 5 params, 120 columns.
- **Don't silence a check with eslint-disable.** Fix the thing, or change the
  rule deliberately and say why.

## Removing what you don't want

Everything is independent:

- Don't want duplication checks? Drop `check:code-duplication` from `check` and
  remove `jscpd`.
- Don't want the pre-commit hook? Delete `.husky/` and the `prepare` script.
- Only using one assistant? Delete the other two rule symlinks.
