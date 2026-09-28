/**
 * Drift guards.
 *
 * Several rules in `agent_rules/` say "change these two things together", and
 * prose is exactly the kind of instruction that gets followed nine times out of
 * ten. The tenth time nothing fails: the code still compiles, the suite still
 * passes, coverage does not move, and the review sees a diff that looks
 * complete. What is actually wrong is that a variable is undocumented, or the
 * walkthrough an agent reads before touching the code no longer describes the
 * code.
 *
 * These are those rules made mechanical. They assert nothing about behaviour —
 * they assert that the repository still says the same thing about itself in
 * every place it says it.
 *
 * Adding a guard here is the right move whenever a rule is written as "keep X
 * and Y in step".
 */
import { readdirSync, readFileSync } from 'node:fs';
import { basename, dirname, join, parse } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

/*
 * Walk up to the directory holding `.git` rather than trusting a fixed number of
 * `..` hops from this file. Tools that sandbox the project — Stryker copies it
 * wholesale before mutating — run this suite from a throwaway copy, and these
 * guards are assertions about the repository, not about the copy.
 */
function findRepoRoot(start: string): string {
  let current = start;

  while (!directoryContains(current, '.git')) {
    const parent = dirname(current);

    if (parent === current) {
      throw new Error(`No .git directory found above ${start}`);
    }

    current = parent;
  }

  return current;
}

function directoryContains(directory: string, entry: string): boolean {
  return readdirSync(directory).includes(entry);
}

const repoRoot = findRepoRoot(fileURLToPath(new URL('.', import.meta.url)));

function read(relativePath: string): string {
  return readFileSync(join(repoRoot, relativePath), 'utf8');
}

/** First capture group of every match, dropping the ones that captured nothing. */
function captures(source: string, pattern: RegExp): string[] {
  return [...source.matchAll(pattern)].map((match) => match[1] ?? '').filter(Boolean);
}

function sorted(values: Iterable<string>): string[] {
  return [...new Set(values)].sort((a, b) => a.localeCompare(b));
}

/*
 * Commented-out entries count on both sides. `sample.env` comments out anything
 * with a default (`# LOG_LEVEL=info` documents the default without overriding
 * it) and `env.ts` carries a commented example field, so requiring the two to
 * agree on *whether* a key is commented would fail on the template as shipped.
 * Membership is the thing that has to match.
 */
/*
 * Horizontal whitespace only (`[\t ]`, not `\s`). With the `m` flag a `\s*`
 * sitting next to `^` can also match the newline it just anchored to, which is
 * both wrong and the ambiguity `sonarjs/slow-regex` objects to.
 */
const SCHEMA_KEY = /^[\t ]*(?:\/\/[\t ]*)?([A-Z][\dA-Z_]*)[\t ]*:/gm;
const SAMPLE_KEY = /^[\t ]*(?:#[\t ]*)?([A-Z][\dA-Z_]*)[\t ]*=/gm;

function schemaBody(source: string): string {
  const [, body] = /z\.object\({([\S\s]*?)^}\)/m.exec(source) ?? [];

  if (body === undefined) {
    throw new Error('Could not find the z.object({ ... }) schema body in src/env.ts');
  }

  return body;
}

describe('src/env.ts and sample.env', () => {
  const schemaKeys = sorted(captures(schemaBody(read('src/env.ts')), SCHEMA_KEY));
  const sampleKeys = sorted(captures(read('sample.env'), SAMPLE_KEY));

  it('finds keys on both sides, so a broken pattern is not read as agreement', () => {
    expect(schemaKeys.length).toBeGreaterThan(0);
    expect(sampleKeys.length).toBeGreaterThan(0);
  });

  it('documents every schema variable in sample.env', () => {
    expect(schemaKeys.filter((key) => !sampleKeys.includes(key))).toEqual([]);
  });

  it('validates every sample.env variable in the schema', () => {
    expect(sampleKeys.filter((key) => !schemaKeys.includes(key))).toEqual([]);
  });
});

const WALKTHROUGH = 'agent_rules/03-code-walkthrough.md';

/** The module map is the first fenced block in the walkthrough. */
function moduleMap(source: string): string {
  const [block] = /```[\S\s]*?```/.exec(source) ?? [];

  if (block === undefined) {
    throw new Error(`Could not find the fenced module map in ${WALKTHROUGH}`);
  }

  return block;
}

/*
 * One flat character class, then a filter on the parsed extension — rather than
 * a pattern ending in `\.ts`, where the extension could be claimed either by the
 * name or by the tail and the engine has to backtrack to find out which.
 */
const WORD_LIKE = /[\w.-]+/g;

function tsFileNames(text: string): string[] {
  return (text.match(WORD_LIKE) ?? []).filter((token) => parse(token).ext === '.ts');
}

function sourceFileNames(): string[] {
  const entries = readdirSync(join(repoRoot, 'src'), { encoding: 'utf8', recursive: true });

  return entries.filter((entry) => parse(entry).ext === '.ts').map((entry) => basename(entry));
}

describe(`src/ and ${WALKTHROUGH}`, () => {
  const mapped = sorted(tsFileNames(moduleMap(read(WALKTHROUGH))));
  const actual = sorted(sourceFileNames());

  it('lists every source file in the module map', () => {
    expect(actual.filter((name) => !mapped.includes(name))).toEqual([]);
  });

  it('maps no file that has since been deleted or renamed', () => {
    expect(mapped.filter((name) => !actual.includes(name))).toEqual([]);
  });
});

/*
 * `.claude/rules`, `.clinerules` and `.kilocode/rules` are symlinks to
 * `agent_rules/`, so every agent reads one set of files. Replace one with a real
 * directory — which is what happens when a tool copies rather than follows it —
 * and the copies diverge silently, each agent obeying a different vintage of the
 * rules. Nothing else in the repository would notice.
 */
const RULE_MIRRORS = ['.claude/rules', '.clinerules', '.kilocode/rules'];

describe('agent rule mirrors', () => {
  const ruleFiles = readdirSync(join(repoRoot, 'agent_rules'), { encoding: 'utf8' });

  it('finds rule files to compare, so an empty list is not read as agreement', () => {
    expect(ruleFiles.length).toBeGreaterThan(0);
  });

  it('serves identical content through every mirror', () => {
    const divergent = RULE_MIRRORS.flatMap((mirror) =>
      ruleFiles
        .filter((file) => read(`${mirror}/${file}`) !== read(`agent_rules/${file}`))
        .map((file) => `${mirror}/${file}`)
    );

    expect(divergent).toEqual([]);
  });
});

/*
 * `AGENTS.md` is the cross-tool entry point (Codex, Cursor, Gemini CLI and
 * others look for it). It cannot be a symlink the way the other mirrors are —
 * a file cannot point at a directory — so it is a hand-written pointer, which
 * makes it the one mirror that can quietly fall behind.
 */
describe('AGENTS.md', () => {
  const linked = sorted(
    captures(read('AGENTS.md'), /agent_rules\/([\w.-]+)/g).filter(
      (name) => parse(name).ext === '.md'
    )
  );
  const actual = sorted(readdirSync(join(repoRoot, 'agent_rules'), { encoding: 'utf8' }));

  it('links every rule file', () => {
    expect(actual.filter((name) => !linked.includes(name))).toEqual([]);
  });

  it('links nothing that has been deleted or renamed', () => {
    expect(linked.filter((name) => !actual.includes(name))).toEqual([]);
  });
});

/*
 * The numbers the rules quote, against the configs that hold them.
 *
 * These are read out of the config files as text rather than by importing them.
 * Importing would be more faithful, but `eslint.config.js` has no type
 * declarations, `stryker.conf.mjs` is plain JS, and `pnpm-workspace.yaml` is not
 * JavaScript at all — so half the probes would be text anyway, and one
 * mechanism reads better than three. Prettier owns the formatting of every file
 * involved, which is what keeps the patterns stable.
 *
 * A probe that stops matching fails the same way a drifted number does: loudly,
 * naming the setting.
 */
interface Probe {
  readonly file: string;
  readonly pattern: RegExp;
  /** Divides the captured number, for a config that stores a different unit. */
  readonly perUnit: number;
}

/** `'max-depth': ['error', { max: 3 }]`, or unquoted for a bare identifier. */
function eslintCap(rule: string): Probe {
  return {
    file: 'eslint.config.js',
    pattern: new RegExp(`(?:'${rule}'|${rule})\\s*:[^\\]]*?max:\\s*(\\d+)`),
    perUnit: 1,
  };
}

const PROBES: Record<string, Probe> = {
  complexity: eslintCap('complexity'),
  'coverage.thresholds': { file: 'vitest.config.ts', pattern: /statements:\s*(\d+)/, perUnit: 1 },
  'max-depth': eslintCap('max-depth'),
  'max-lines': eslintCap('max-lines'),
  'max-lines-per-function': eslintCap('max-lines-per-function'),
  'max-params': eslintCap('max-params'),
  'max-statements': eslintCap('max-statements'),
  // Stored in minutes, quoted in days.
  minimumReleaseAge: {
    file: 'pnpm-workspace.yaml',
    pattern: /minimumReleaseAge:\s*(\d+)/,
    perUnit: 60 * 24,
  },
  printWidth: { file: '.prettierrc', pattern: /"printWidth":\s*(\d+)/, perUnit: 1 },
  'thresholds.break': { file: 'stryker.conf.mjs', pattern: /break:\s*(\d+)/, perUnit: 1 },
};

function probeValue(setting: string, probe: Probe): number {
  const [, captured] = probe.pattern.exec(read(probe.file)) ?? [];

  if (captured === undefined) {
    throw new Error(`Probe for "${setting}" no longer matches anything in ${probe.file}`);
  }

  return Number(captured) / probe.perUnit;
}

/** Rows of the "numbers" table: a backticked setting, then its value. */
const TABLE_ROW = /^\|\s*`([^`]+)`[^|]*\|\s*(\d+)\s*\|/gm;

function documentedNumbers(): Map<string, number> {
  const rows = [...read('agent_rules/02-coding-guidelines.md').matchAll(TABLE_ROW)];

  return new Map(rows.map((row) => [row[1] ?? '', Number(row[2])]));
}

describe('the numbers agent_rules quotes', () => {
  const documented = documentedNumbers();

  it('documents every setting that has a probe, and no others', () => {
    expect(sorted(documented.keys())).toEqual(sorted(Object.keys(PROBES)));
  });

  it('quotes the value the config actually holds', () => {
    const drifted = Object.entries(PROBES)
      .map(([setting, probe]) => ({
        actual: probeValue(setting, probe),
        documented: documented.get(setting),
        setting,
      }))
      .filter((row) => row.documented !== row.actual);

    expect(drifted).toEqual([]);
  });

  it('keeps the four coverage thresholds on one number', () => {
    const thresholds = captures(
      read('vitest.config.ts'),
      /(?:statements|branches|functions|lines):\s*(\d+)/g
    );

    expect(thresholds).toHaveLength(4);
    expect(new Set(thresholds).size).toBe(1);
  });
});
