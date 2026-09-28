# Agent instructions

The rules for this repository live in [`agent_rules/`](./agent_rules). Read all
of them before changing anything:

- [`agent_rules/01-overview.md`](./agent_rules/01-overview.md) — what this
  project is, and the response/documentation style to write in.
- [`agent_rules/02-coding-guidelines.md`](./agent_rules/02-coding-guidelines.md)
  — the checks, the caps, the dependency bar, the test conventions.
- [`agent_rules/03-code-walkthrough.md`](./agent_rules/03-code-walkthrough.md) —
  the module map and the reasoning behind each area. Keep it current; a test
  fails when it falls behind.
- [`agent_rules/04-committing.md`](./agent_rules/04-committing.md) — commit
  message conventions.

## Why this file is a pointer and not a copy

`agent_rules/` is the one real copy. `.claude/rules`, `.clinerules` and
`.kilocode/rules` are symlinks to it, so every tool reads the same bytes.

`AGENTS.md` cannot be a symlink to a directory, so it is a pointer instead —
and a pointer is a thing that can go stale. `src/driftGuard.test.ts` asserts
that the list above names every file in `agent_rules/`, and no others.

Edit the files in `agent_rules/`. Never edit a mirror.
