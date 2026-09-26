import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  // tsconfig keeps `jsx: "preserve"` for Next.js; tests need JSX compiled with the React 19 runtime.
  oxc: {
    jsx: { runtime: 'automatic' },
  },
  test: {
    globals: true,
    // Node by default; React component tests opt into jsdom with a
    // `// @vitest-environment jsdom` docblock on their first line.
    environment: 'node',
    setupFiles: ['./vitest.setup.ts'],
    exclude: ['e2e/**', 'node_modules/**', '.next/**'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
