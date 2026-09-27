#!/usr/bin/env bash
#
# Run a long job in a detached tmux session so it outlives whatever started it.
#
# A long job — an integration suite, a data build, a fleet comparison — is
# easily long enough that the thing invoking it (an editor task runner, a CI
# step, an agent) gets torn down mid-run. When that happens to a plain
# foreground command the job dies with it, and because most test runners buffer
# their output you are left with an empty log and no idea how far it got.
#
# tmux fixes the first half; this wrapper fixes the second. Every run gets:
#   - a log file that is written continuously, not at exit
#   - a status file: `running` while in flight, then the numeric exit code
#   - a `wait` subcommand that blocks and exits with the job's own code
#
# The tmux session ENDS when the job does, so `tmux has-session` is not the
# source of truth — the status file is. That distinction matters: a session
# that lingered would look identical to one still working.
#
# Usage:
#   scripts/bg-task.sh start <name> <command...>   # launch (fails if already running)
#   scripts/bg-task.sh status <name>               # state + last lines
#   scripts/bg-task.sh wait <name>                 # block until done; exits with its code
#   scripts/bg-task.sh logs <name> [-f]            # dump (or follow) the log
#   scripts/bg-task.sh list                        # every known task
#
# `load_env.sh` is sourced automatically when the repo root has one. Forgetting
# to load a job's environment is the other common way a long run fails 40
# minutes in, so it is done for you; a job that needs no env still runs.

set -uo pipefail

# Repo-local by default, so two checkouts of the same project don't collide
# over a task name. Override with BG_TASK_DIR.
TASK_DIR="${BG_TASK_DIR:-$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)/.bg-tasks}"
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

log_path() { printf '%s/%s.log' "$TASK_DIR" "$1"; }
status_path() { printf '%s/%s.status' "$TASK_DIR" "$1"; }

die() {
  echo "bg-task: $*" >&2
  exit 2
}

require_name() {
  [ -n "${1:-}" ] || die "missing <name>"
}

# `running`, an exit code, or `unknown` for a name we've never seen.
read_status() {
  cat "$(status_path "$1")" 2>/dev/null || echo unknown
}

cmd_start() {
  local name=${1:-}
  require_name "$name"
  shift
  [ "$#" -gt 0 ] || die "missing <command...>"
  command -v tmux >/dev/null || die "tmux is not installed"

  if [ "$(read_status "$name")" = running ] && tmux has-session -t "$name" 2>/dev/null; then
    die "'$name' is already running — use 'wait $name' or 'status $name'"
  fi

  mkdir -p "$TASK_DIR"
  tmux kill-session -t "$name" 2>/dev/null
  : > "$(log_path "$name")"
  echo running > "$(status_path "$name")"

  # %q-quote so arguments with spaces survive the trip through tmux's shell.
  local quoted
  quoted=$(printf '%q ' "$@")

  # Sourcing is best-effort: a job that doesn't need the env still runs.
  tmux new-session -d -s "$name" -c "$REPO_ROOT" \
    "{ [ -f ./load_env.sh ] && . ./load_env.sh >/dev/null 2>&1; $quoted; } \
       >>$(printf '%q' "$(log_path "$name")") 2>&1; \
     echo \$? > $(printf '%q' "$(status_path "$name")")"

  echo "bg-task: started '$name'"
  echo "  log:    $(log_path "$name")"
  echo "  follow: scripts/bg-task.sh logs $name -f"
  echo "  wait:   scripts/bg-task.sh wait $name"
}

# `running` / `died` / `done` / an exit code / `unknown`. A stored `running`
# with no live session means the job was killed outright (OOM, reboot, the
# machine going away) and never reached the line that records its code —
# reporting that as "still running" is the one answer that would mislead.
resolve_state() {
  local state
  state=$(read_status "$1")
  if [ "$state" = running ] && ! tmux has-session -t "$1" 2>/dev/null; then
    echo died
  else
    echo "$state"
  fi
}

cmd_status() {
  local name=${1:-}
  require_name "$name"
  local state
  state=$(resolve_state "$name")
  case "$state" in
    unknown) echo "bg-task: '$name' — no such task"; return 1 ;;
    running) echo "bg-task: '$name' — RUNNING ($(wc -l < "$(log_path "$name")") log lines)" ;;
    died) echo "bg-task: '$name' — DIED (killed before it could record an exit code)" ;;
    0) echo "bg-task: '$name' — DONE (exit 0)" ;;
    *) echo "bg-task: '$name' — FAILED (exit $state)" ;;
  esac
  echo '--- last 15 lines ---'
  tail -15 "$(log_path "$name")" 2>/dev/null
  case "$state" in
    running | 0) return 0 ;;
    *) return 1 ;;
  esac
}

cmd_wait() {
  local name=${1:-}
  require_name "$name"
  [ "$(read_status "$name")" = unknown ] && die "'$name' — no such task"
  while [ "$(read_status "$name")" = running ]; do
    tmux has-session -t "$name" 2>/dev/null || break
    sleep 10
  done
  local state
  state=$(read_status "$name")
  cmd_status "$name"
  [ "$state" = running ] && return 1
  return "$state"
}

cmd_logs() {
  local name=${1:-}
  require_name "$name"
  if [ "${2:-}" = "-f" ]; then
    tail -f "$(log_path "$name")"
  else
    cat "$(log_path "$name")"
  fi
}

cmd_list() {
  [ -d "$TASK_DIR" ] || { echo 'bg-task: no tasks yet'; return 0; }
  shopt -s nullglob
  local found=0
  for status_file in "$TASK_DIR"/*.status; do
    found=1
    local name
    name=$(basename "$status_file" .status)
    printf '%-14s %s\n' "$name" "$(resolve_state "$name")"
  done
  [ "$found" = 1 ] || echo 'bg-task: no tasks yet'
}

case "${1:-}" in
  start) shift; cmd_start "$@" ;;
  status) shift; cmd_status "$@" ;;
  wait) shift; cmd_wait "$@" ;;
  logs) shift; cmd_logs "$@" ;;
  list) cmd_list ;;
  *)
    die "usage: bg-task.sh {start <name> <cmd...>|status <name>|wait <name>|logs <name> [-f]|list}"
    ;;
esac
