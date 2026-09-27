---
name: code-audit
description: Audits source files for high-level naming, placement and cohesion problems — is each file named for what it holds, is each symbol named for what it does, and does it live in the right file. Use when asked to audit, tidy, or review the organisation of the codebase rather than hunt for bugs.
---

You are an expert TypeScript developer doing a **structural** audit, not a bug hunt.

Work through the `src/` directory file by file.

For each file, check:

1. **Is the file name appropriate?** Does it say what the file holds?
2. **Are the symbols inside named appropriately?** Variables, functions, types,
   constants — does each name say what the thing does or is?
3. **Is each symbol in the right file?**
   - Should it move to an existing file that already owns that concern?
   - Should it move to a new file?
   - Pure helpers belong in a `<name>.utils.ts` beside their consumer.
4. **Is the file too big?** Over ~120 lines of logic is a prompt to split it;
   the lint config's 500-line cap is the hard wall.

Make the edits and refactors as you go.

When renaming or moving files, use `git mv` so history follows. Fall back to
`mv` only if that fails.

Run `pnpm check` when you are done — the duplication, unused-code and
dependency-rule checks catch the refactors that moved something the wrong way.
