---
name: write-tests
description: Writes tests in this project's house style — hermetic, behaviour-first, assertion-bearing, and able to survive mutation testing. Use when adding or changing tests, when coverage or mutation score needs to move, or when a test is failing for reasons that look like the test's fault.
---

The failure mode this project cares about is not the missing test. It is the
test that passes without checking anything — and that one is invisible to a
test run, a coverage number and a diff review alike.

Write with that in mind.

## Where a test goes

- Unit tests sit beside the code: `foo.ts` → `foo.test.ts`.
- They must be **hermetic**: no network, no real service, no clock you do not
  control, no dependence on test ordering.
- A test that needs a real external service is `foo.integration.test.ts`. Those
  are excluded from the default suite.
- Pure logic worth testing directly belongs in `foo.utils.ts`, imported by
  `foo.ts`. Extracting is the standard fix when a line cannot be reached
  meaningfully through its caller.

## What to assert

- Assert on the **value**, not on the fact that something happened.
  `toBeDefined()`, `toBeTruthy()` and a bare `not.toThrow()` are how a test ends
  up asserting nothing. Prefer the exact value, or a regex that would fail if
  the interesting part changed.
- Test **behaviour**, not implementation. A test that breaks on a rename but not
  on a wrong answer is a test that will be deleted the first time it is
  inconvenient.
- One idea per `it`. The name should say what is true, not what is called:
  _"throws naming the offending variable"_, not _"tests parseEnv"_.
- Do not snapshot internals. A snapshot of a structure nobody reads is a record
  that it changed, not a claim that it is right.

## What the linter will not let you do

`@vitest/eslint-plugin` runs on every test file. It fails:

- a test with no assertion at all;
- `it.only` — which quietly parks the rest of the suite — and `it.skip`;
- an `expect` inside an `if`, where the fixture decides whether anything is
  checked;
- two tests with the same name in one block;
- an `expect` in a loop or callback with no `expect.assertions(n)` to prove it
  ran.

Do not silence one of these. A test that trips a rule here is a test that is
not checking what its name says it checks.

## Proving the test is real

```bash
pnpm test:mutation
```

Stryker changes the source one small edit at a time and reruns the suite. A
**surviving** mutant is a line no test pins down — coverage saw it execute and
nothing asserted on what it did.

- Read a survivor as a missing assertion, not as a line to delete.
- If the mutant is unkillable because the only caller cannot reach the
  interesting case, extract the logic to `*.utils.ts` and test it directly.
- Never lower the `break` threshold in `stryker.conf.mjs`, or a coverage floor
  in `vitest.config.ts`, to get to green. Both are ratchets.

## Before calling it done

```bash
pnpm check
```

Deleting or skipping a test to make the gate pass fails the gate instead.
