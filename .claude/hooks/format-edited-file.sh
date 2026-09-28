#!/usr/bin/env bash
# PostToolUse hook: format and autofix a file the moment it is written.
#
# Why at edit time rather than at the end: `pnpm check` reports mechanical
# problems only once the whole task is done, by which point the fix is a diff
# across many files and competes for attention with real findings. Fixing
# formatting and autofixable lint here keeps `pnpm check`'s output about things
# that need judgement.
#
# Exit 0 always. This hook tidies; it is not a gate. `pnpm check` is the gate.
set -uo pipefail

file_path=$(jq -r '.tool_input.file_path // empty')
[ -z "$file_path" ] && exit 0
[ -f "$file_path" ] || exit 0

case "$file_path" in
  *.ts | *.tsx | *.js | *.mjs | *.cjs | *.json | *.md | *.yml | *.yaml) ;;
  *) exit 0 ;;
esac

cd "$CLAUDE_PROJECT_DIR" || exit 0

case "$file_path" in
  *.ts | *.tsx | *.js | *.mjs | *.cjs)
    pnpm exec eslint --fix "$file_path" >/dev/null 2>&1
    ;;
esac

pnpm exec prettier --write --log-level error "$file_path" >/dev/null 2>&1

exit 0
