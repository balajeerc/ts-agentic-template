import { describe, expect, it } from 'vitest';

import { parseEnv } from './env';

describe('parseEnv', () => {
  it('applies defaults when optional variables are absent', () => {
    const env = parseEnv({});

    expect(env.NODE_ENV).toBe('development');
    expect(env.LOG_LEVEL).toBe('info');
  });

  it('keeps values that are present', () => {
    const env = parseEnv({ NODE_ENV: 'production', LOG_LEVEL: 'warn' });

    expect(env).toEqual({ NODE_ENV: 'production', LOG_LEVEL: 'warn' });
  });

  it('throws naming the offending variable', () => {
    expect(() => parseEnv({ NODE_ENV: 'staging' })).toThrow(/NODE_ENV/);
  });
});
