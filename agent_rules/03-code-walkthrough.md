# Source Code Walkthrough

<!--
TEMPLATE: this is the file agents read to find their way around. Keep it
accurate — a stale walkthrough is worse than none, because it is trusted.

Split it into several numbered files (03-code-walkthrough-<area>.md) once one
file stops being readable, and list them here.
-->

## Module map

```
src/
└── index.ts        # entry point
```

## Conventions

- Document the ones a reader cannot infer from the code: units, timezones,
  sign conventions, what is authoritative when two sources disagree.
- Record WHY a non-obvious decision was made, not just what it was. The reason
  is what stops it being undone by the next person.

## Areas

<!-- One section per subsystem. For each: what it owns, what it must not
     import, and the gotchas that have already bitten someone. -->
