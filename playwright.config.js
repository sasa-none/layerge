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
    // NOTE: workers は既定（コア数依存）のままとする（ROADMAP B-7 で実測）。
    // 並列度を 4 に絞っても 1 実行あたりの接続数は減らず（+305 対 +347）、
    // 所要時間だけが 22.7 秒から 38.4 秒へ伸びた。接続数は総ページロード数で
    // 決まるため、並列度は E2E の不安定さの要因ではない。
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
        // 4173 に残っている別プロセスのサーバーを再利用しない（ROADMAP B-7）。
        // 再利用は偽の失敗（別テストが毎回 ERR_CONNECTION_TIMED_OUT / ERR_ABORTED で落ちる）を
        // 3 回引き起こしており、原因の切り分けに時間を要した。決定性を利便性より優先する。
        reuseExistingServer: false,
        // First boot may take a bit (Vite dep scan/optimize), so be generous.
        timeout: 240_000,
        stdout: 'pipe',
        stderr: 'pipe'
    }
});
