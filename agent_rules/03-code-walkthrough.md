# Source Code Walkthrough

## Module map

```
src/
├── index.ts        # entry point; wires env + logger, exposes `run`
├── env.ts          # parsed, validated process environment (zod)
├── env.test.ts
├── logger.ts       # the pino logger singleton
└── index.test.ts
```

## Conventions

- Document the ones a reader cannot infer from the code: units, timezones,
  sign conventions, what is authoritative when two sources disagree.
- Record WHY a non-obvious decision was made, not just what it was. The reason
  is what stops it being undone by the next person.

## Areas

### Environment — `src/env.ts`

- `env` is the only sanctioned way to read configuration.
- Never read `process.env` directly outside this file.
- The schema is parsed once, at import time. A bad variable fails at boot.
- The error names the offending variable.
- `parseEnv` is exported for tests, so the failure path is testable without
  mutating the real `process.env`.
- Adding a variable means editing `src/env.ts` **and** `sample.env` together.

### Logging — `src/logger.ts`

- `no-console` is a lint error. `logger` is the way out.
- Production emits newline-delimited JSON. That is what log shippers parse.
- Development uses `pino-pretty`, which is a **devDependency**. It must never be
  reachable on the production path.
- Use `logger.child({ requestId })` to carry context down a call path.
- Prefer passing a `Logger` as a parameter over importing the singleton. A
  function that receives what it talks to is one a test can drive.

### Entry point — `src/index.ts`

- `run(log, name)` takes its logger as a parameter. That is the pattern to copy.
- `main()` is the only place that reaches for the module-level singleton.
