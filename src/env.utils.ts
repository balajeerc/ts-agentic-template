/**
 * Pure helpers for `env.ts`.
 *
 * `formatIssues` lives here rather than inline because a function reachable only
 * through a failing `parseEnv` call is a function whose output shape no test can
 * pin down precisely — the schema in `env.ts` is flat, so a real `ZodError` from
 * it never has a nested path. Exported, it can be driven directly with the
 * errors a grown-up schema produces.
 */
import { type z } from 'zod';

/**
 * Render Zod issues as one indented `path: message` line each.
 *
 * The path is dotted (`server.port`, not `serverport`) so a nested field names
 * itself; the newline join is what keeps a second bad variable visible instead
 * of hidden behind the first.
 */
export function formatIssues(error: z.ZodError): string {
  return error.issues.map((issue) => `  ${issue.path.join('.')}: ${issue.message}`).join('\n');
}
