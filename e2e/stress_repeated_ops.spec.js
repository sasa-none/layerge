import {expect, test} from '@playwright/test';

import {readStressIters} from './_helpers/stressEnv.js';

test('v4: repeated mixed operations do not crash and return to baseline', async ({page}, testInfo) => {
    const iters = readStressIters();

    // This is a stress-style E2E; give it more room than the default 30s.
    test.setTimeout(Math.max(90_000, iters * 5_000));

    /** @type {Error[]} */
    const pageErrors = [];
    /** @type {{iter: number, traceId: string, text: string}[]} */
    const consoleErrors = [];

    let currentIter = -1;
    let lastTraceId = '';

    page.on('pageerror', (err) => {
        pageErrors.push(err);
    });

    page.on('console', (msg) => {
        const text = msg.text();

        // Keep the latest outcome traceId for debugging.
        if (text.startsWith('[layerge] outcome')) {
            const m = text.match(/traceId=([^\s]+)/);
            if (m) {
                lastTraceId = m[1];
            }
        }

        if (msg.type() !== 'error') {
            return;
        }

        // Keep it simple: treat any console.error as a failure signal.
        // If you later introduce intentional errors for demo, add allowlist here.
        consoleErrors.push({iter: currentIter, traceId: lastTraceId || '-', text: text});
    });

    await page.addInitScript(() => {
        // dev-only opt-in
        // @ts-ignore
        globalThis.__LAYERGE_DECISION_TRACE_LEVEL = 'on-unexpected';
    });

    await page.goto('/advanced');

    const state = page.getByTestId('advanced-state');
    const asyncLog = page.getByTestId('advanced-async-log');
    const overlayPresenter = page.getByTestId('overlay-presenter');
    const overlayClose = page.getByTestId('overlay-close');

    const expectBaseline = async () => {
        await expect(state).toContainText('depth=0', {timeout: 15_000});
        await expect(state).toContainText('lastEntryId=-', {timeout: 15_000});
        // When depth=0, presenter overlay should be gone.
        await expect(overlayPresenter).toHaveCount(0, {timeout: 15_000});
    };

    const closeToBaseline = async () => {
        // Prefer closing via the overlay UI (stable, not blocked by pointer-events).
        // If overlay isn't present, fall back to closeAll() on the background page.
        if (await overlayClose.count()) {
            await overlayClose.click({timeout: 15_000});
        } else {
            await page.getByTestId('advanced-close-all').click({force: true, timeout: 15_000});
        }
        await expectBaseline();
    };

    const attachDumpInternal = async (label) => {
        const dump = await page.evaluate(() => {
            // @ts-ignore
            return globalThis.__layergeDumpDecisionTraces?.({pretty: true, max: 50}) ?? '';
        });

        if (dump) {
            await testInfo.attach(label, {
                body: dump,
                contentType: 'application/json'
            });
        }
    };

    try {
        await expectBaseline();

        for (let i = 0; i < iters; i++) {
            currentIter = i;
            // Trigger a predictable superseded case (slow then fast).
            await page.getByTestId('advanced-push-async-slow').click();
            await page.waitForTimeout(30);
            await page.getByTestId('advanced-push-async-fast').click();

            await expect(asyncLog).toContainText('pushAsync(fast): start');
            await expect(asyncLog).toContainText('pushAsync(fast): completed');

            // Close back to baseline.
            await closeToBaseline();

            // Periodically test "blocked" path via controlledHooks.
            if (i % 5 === 0) {
                await page.getByTestId('advanced-cancel-open').check();
                await page.getByTestId('advanced-open').click();
                await page.waitForTimeout(50);
                await expectBaseline();
                await page.getByTestId('advanced-cancel-open').uncheck();
            }
        }
    } catch (err) {
        await attachDumpInternal('decision_traces_on_failure.json');
        throw err;
    }

    if (pageErrors.length > 0 || consoleErrors.length > 0) {
        await attachDumpInternal('decision_traces_on_errors.json');
    }

    expect(pageErrors, 'pageerror should be empty').toEqual([]);
    expect(consoleErrors, 'console.error should be empty').toEqual([]);
});
