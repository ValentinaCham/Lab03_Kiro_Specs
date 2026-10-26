import { defineConfig } from 'vitest/config';

type VitestMode = 'all' | 'unit' | 'property' | 'e2e' | 'eval';

const mode = (process.env.VITEST_MODE ?? 'all') as VitestMode;

const includeByMode: Record<VitestMode, string[]> = {
  all: ['src/**/*.test.ts', 'tests/**/*.test.ts'],
  unit: ['src/**/*.test.ts'],
  property: ['src/**/*.prop.test.ts'],
  e2e: ['src/**/*.e2e.test.ts', 'tests/**/*.e2e.test.ts'],
  eval: ['tests/evals/**/*.test.ts', 'src/**/*.prop.test.ts'],
};

const excludeByMode: Record<VitestMode, string[]> = {
  all: [],
  unit: ['**/node_modules/**', '**/dist/**', '**/*.prop.test.ts', '**/*.e2e.test.ts'],
  property: ['**/node_modules/**', '**/dist/**'],
  e2e: ['**/node_modules/**', '**/dist/**'],
  eval: ['**/node_modules/**', '**/dist/**'],
};

export default defineConfig({
  test: {
    environment: 'jsdom',
    include: includeByMode[mode],
    exclude: excludeByMode[mode],
    globals: false,
    restoreMocks: true,
    unstubGlobals: true,
  },
});
