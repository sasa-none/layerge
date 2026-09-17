import {defineConfig, devices} from '@playwright/test';

/**
 * Playwright E2E runs against the demo app.
 *
 * Notes:
 * - Uses Vite dev server for faster iteration.
 * - Uses strictPort to avoid flakiness when port is occupied.
 */
export default defineConfig({
    testDir: './e2e',
    timeout: 30_000,
    expect: {
        timeout: 10_000
    },
    fullyParallel: true,
    retries: process.env.CI ? 2 : 0,
    reporter: process.env.CI ? 'github' : 'list',
    use: {
        baseURL: 'http://127.0.0.1:4173',
        trace: 'on-first-retry'
    },
    projects: [
        {
            name: 'chromium',
            use: {
                ...devices['Desktop Chrome']
            }
        }
    ],
    webServer: {
        // Use `cwd` instead of `pnpm -C` for better compatibility across shells.
        cwd: './demo',
        command: 'pnpm dev --host 127.0.0.1 --port 4173 --strictPort',
        url: 'http://127.0.0.1:4173',
        reuseExistingServer: !process.env.CI,
        // First boot may take a bit (Vite dep scan/optimize), so be generous.
        timeout: 240_000,
        stdout: 'pipe',
        stderr: 'pipe'
    }
});
