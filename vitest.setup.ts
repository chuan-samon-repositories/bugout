import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';

// Testing Library only auto-cleans when test globals are detected at import
// time; unmount explicitly so every test starts from an empty document.
afterEach(async () => {
  if (typeof document === 'undefined') return;
  const { cleanup } = await import('@testing-library/react');
  cleanup();
});
