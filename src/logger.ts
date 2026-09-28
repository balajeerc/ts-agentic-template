/**
 * The application logger.
 *
 * `no-console` is a lint error, so this is the only way out. Console output has
 * no level, no structure and no timestamp, which makes it useless the moment
 * logs are aggregated rather than read in a terminal.
 *
 * Production emits newline-delimited JSON, which is what log shippers parse.
 * Development gets `pino-pretty`, which is a devDependency and so must never be
 * reachable on the production path.
 *
 * Child loggers carry context down a call path:
 *   const log = logger.child({ requestId });
 */
import pino from 'pino';

import { env } from './env';

const isDevelopment = env.NODE_ENV === 'development';

export const logger = pino({
  level: env.LOG_LEVEL,
  ...(isDevelopment ? { transport: { target: 'pino-pretty', options: { colorize: true } } } : {}),
});

export type Logger = typeof logger;
