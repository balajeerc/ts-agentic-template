/**
 * Parsed, validated process environment.
 *
 * Import `env` from here; never read `process.env` directly. `process.env.X` is
 * `string | undefined`, and since non-null assertions are a lint error the only
 * alternatives at the call site are a cast or a widened type — both of which
 * turn a missing variable into a runtime failure somewhere far away.
 *
 * Parsing happens once, at import time, so a bad or absent variable fails at
 * boot with a message naming the variable, rather than mid-request.
 *
 * Add a field here and to `sample.env` together. Keep them in step.
 */
import { z } from 'zod';

import { formatIssues } from './env.utils';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
  // EXAMPLE_API_KEY: z.string().min(1),
});

/** The shape of the validated environment. */
export type Env = z.infer<typeof envSchema>;

export const env: Env = parseEnv(process.env);

/**
 * Exported for tests, which need to exercise the failure path without mutating
 * the real `process.env`.
 */
export function parseEnv(source: NodeJS.ProcessEnv): Env {
  const result = envSchema.safeParse(source);

  if (!result.success) {
    throw new Error(`Invalid environment:\n${formatIssues(result.error)}`);
  }

  return result.data;
}
