---
name: add-dependency
description: Adds a npm dependency to this project the way its rules require — resolve the real repository, check the star count, pick a version old enough to install, and install with scripts off. Use whenever a package is about to be added, swapped, or upgraded across a major version, including a pinned third-party binary.
---

Adding a dependency here is a procedure, not a judgement call. Work through it
in order. Stop at the first step that fails and report, rather than working
around it.

## 1. Resolve the real repository

The npm name is not the repository name, and a scoped name says nothing about
who maintains it.

```bash
npm view <package> repository.url
```

## 2. Read the star count

```bash
gh api repos/{owner}/{repo} --jq .stargazers_count
```

**The bar is 2,000 stars.** Two things clear it without meeting it:

- the package is maintained under the `eslint-community` organisation;
- the package is first-party to a project that clears the bar on its own — an
  official plugin counts as the project it plugs into.

If it clears the bar, continue. If it does not:

- **Stop.** Do not install it.
- Report the package, its repository, and the star count to the user.
- Ask for explicit permission.
- If granted, add a row to _Recorded exceptions to the star threshold_ in
  `agent_rules/02-coding-guidelines.md`. An exception nobody wrote down is
  indistinguishable from the rule not being followed.

Third-party binaries are dependencies too, even though they never appear in
`package.json`. The same check applies to the tool's repository — and once it
passes, pin the version and verify a checksum on download.
`scripts/installGitleaks.sh` is the pattern to copy. Never fetch `latest`, and
never pipe a download into a shell.

## 3. Pick a version that will actually install

`minimumReleaseAge` in `pnpm-workspace.yaml` refuses anything published in the
last 30 days. It constrains **resolution**, not just verification: a `^x.y.z`
range whose only satisfying release is from this week has nothing to fall back
to, and the install fails outright.

```bash
npm view <package> time --json
```

Range at the newest **matured** version — `^4.2.0`, not `^4.2.1`, when 4.2.1 is
two weeks old. It drifts upward on its own once the newer release matures.

## 4. Install with scripts off

```bash
pnpm add --ignore-scripts <package>          # runtime
pnpm add -D --ignore-scripts <package>       # dev
```

An install script is arbitrary code running as the current user, with the home
directory — and every credential in it — in reach.

If the package genuinely needs its build step, look at what that step does,
then add it to `allowBuilds` in `pnpm-workspace.yaml`, one package at a time.

Never add to `trustPolicyExclude` to make an install pass. Each entry there is
a reviewed exception pinned to an exact version.

## 5. Confirm nothing else moved

```bash
pnpm check
```

`knip` is the one to watch: a dependency used only in a JSDoc type or a config
file still has to be listed, and one nothing imports has to be removed.

## 6. Say what changed and why

In the commit message or the summary, name the package, what it replaced or
added, and the star count if it was an exception. The next person reading the
lockfile diff should not have to reconstruct the reasoning.
