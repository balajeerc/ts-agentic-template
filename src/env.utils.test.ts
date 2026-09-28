import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import { formatIssues } from './env.utils';

/*
 * A nested fixture schema rather than the real one from `env.ts`. The real
 * schema is flat, so every path it produces is one segment long and a dotted
 * join is indistinguishable from no join at all — which is exactly the kind of
 * line a passing suite can leave completely unpinned.
 */
const fixtureSchema = z.object({
  name: z.string(),
  server: z.object({ port: z.number() }),
});

function errorFor(value: unknown): z.ZodError {
  const result = fixtureSchema.safeParse(value);

  if (result.success) {
    throw new Error('fixture was expected to fail parsing');
  }

  return result.error;
}

describe('formatIssues', () => {
  it('dots a nested path so the field names itself', () => {
    const formatted = formatIssues(errorFor({ name: 'ok', server: { port: 'nope' } }));

    expect(formatted).toMatch(/^ {2}server\.port: .+$/);
  });

  it('gives every issue its own line, so a second one is not hidden', () => {
    const lines = formatIssues(errorFor({ name: 42, server: { port: 'nope' } })).split('\n');

    expect(lines).toHaveLength(2);
    expect(lines.every((line) => /^ {2}\S+: .+$/.test(line))).toBe(true);
  });
});
