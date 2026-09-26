import { test as base, expect, type ConsoleMessage, type Page } from '@playwright/test';

export interface PageProblems {
  consoleErrors: string[];
  pageErrors: string[];
}

interface Fixtures {
  /** True when the test runs in the "mobile" project (Pixel 7). */
  isMobile: boolean;
  /** Console errors and uncaught page errors seen by `page` during the test. */
  problems: PageProblems;
}

/**
 * Project-wide `test`. Each test already gets a fresh browser context (Playwright default),
 * so storage, cookies and consent start empty.
 */
export const test = base.extend<Fixtures>({
  isMobile: async ({}, use, testInfo) => {
    await use(testInfo.project.name === 'mobile');
  },
  problems: async ({ page }, use) => {
    const problems: PageProblems = { consoleErrors: [], pageErrors: [] };
    const onConsole = (message: ConsoleMessage) => {
      if (message.type() === 'error') problems.consoleErrors.push(message.text());
    };
    const onPageError = (error: Error) => problems.pageErrors.push(`${error.name}: ${error.message}`);
    page.on('console', onConsole);
    page.on('pageerror', onPageError);
    await use(problems);
    page.off('console', onConsole);
    page.off('pageerror', onPageError);
  },
});

export { expect };
export type { Page };
