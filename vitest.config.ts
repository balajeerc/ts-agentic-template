import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    include: ['src/**/*.test.ts'],
    // Integration tests live alongside unit tests but talk to real external
    // services. Keep the default suite fast and hermetic; give them their own
    // config + script when the project grows some.
    exclude: ['**/node_modules/**', '**/dist/**', '**/*.integration.test.ts'],
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text-summary', 'lcov'],
      include: ['src/**/*.ts'],
      // Boot wiring: these construct a singleton from `env` at import time and
      // have no logic of their own worth asserting on.
      exclude: ['src/**/*.test.ts', 'src/**/__fixtures__/**', 'src/index.ts', 'src/logger.ts'],
      // A floor, not a target. It exists so that deleting or skipping a test to
      // make a task pass fails the gate instead of going unnoticed. Raise it as
      // the suite grows — a ratchet that only goes up.
      thresholds: {
        statements: 80,
        branches: 80,
        functions: 80,
        lines: 80,
      },
    },
  },
});
