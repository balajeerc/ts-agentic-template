/**
 * Entry point.
 *
 * Replace this with the real thing. It exists so `pnpm check` has something to
 * typecheck, lint, cruise and test on a fresh clone — a template whose checks
 * pass only because there is no code is a template that has not been verified.
 *
 * `run` takes its logger as a parameter rather than reaching for the module-level
 * singleton. That is the pattern worth copying: a function that receives what it
 * talks to is one a test can drive without stubbing a module.
 */
import { env } from './env';
import { logger, type Logger } from './logger';

export function greet(name: string): string {
  return `Hello, ${name}!`;
}

export function run(log: Logger, name: string): string {
  const greeting = greet(name);
  log.info({ nodeEnv: env.NODE_ENV }, greeting);
  return greeting;
}

export function main(): void {
  run(logger, 'world');
}
