import {expect, test} from '@playwright/test';

import {readStressIters} from './_helpers/stressEnv.js';

/**
 * Stress: mix closeAsync(lastEntryId) paths (completed + aborted) repeatedly.
 *
 * Goal: ensure repeated async closes do not leave a presenter hanging and do not crash.
 * Note: We use in-overlay controls to avoid flakiness caused by clicking behind overlays.
 */

test('v4: repeated closeAsync(lastEntryId) mixed outcomes do not crash and always return to baseline', async ({page}, testInfo) => {
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

        consoleErrors.push({iter: currentIter, traceId: lastTraceId || '-', text: text});
    });

    await page.addInitScript(() => {
        // dev-only opt-in
        // @ts-ignore
        globalThis.__LAYERGE_DECISION_TRACE_LEVEL = 'on-unexpected';
    });

    await page.goto('/advanced');

    const state = page.getByTestId('advanced-state');
    const content = page.getByTestId('advanced-leave-guard-content');

    const expectBaseline = async () => {
        // The demo's "lastEntryId" is not guaranteed to reset to "-" even after the presenter fully closes.
        // Baseline for this stress test is "no leaving UI" + "depth=0" on the page.
        await expect(content).toHaveCount(0, {timeout: 15_000});
        await expect(state).toContainText('state: page / depth=0', {timeout: 15_000});
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
        // Ensure baseline at start.
        await expectBaseline();

        // Alternate outcomes:
        // - every 3rd iteration: confirm dialog is dismissed => aborted
        // - others: close proceeds => completed
        for (let i = 0; i < iters; i++) {
            currentIter = i;

            // Open presenter.
            await page.getByTestId('advanced-open').click();
            await expect(content).toBeVisible({timeout: 15_000});

            // Wait until lastEntryId is captured.
            await expect(state).toContainText('lastEntryId=', {timeout: 15_000});
            await expect(state).not.toContainText('lastEntryId=-', {timeout: 15_000});

            // Decide the outcome.
            const shouldAbort = i % 3 === 0;

            // The demo uses window.confirm when dirty=true.
            if (shouldAbort) {
                // Ensure dirty=true (default). If it was changed by prior iteration, re-check it.
                await page.getByTestId('advanced-dirty').check();

                // Dismiss confirm => aborted.
                page.once('dialog', async (dialog) => {
                    await dialog.dismiss();
                });

                await page.getByTestId('advanced-close-async-self').click();
                await expect(page.getByTestId('advanced-async-log')).toContainText('closeAsync: aborted', {timeout: 15_000});

                // Close it for real to return to baseline.
                await page.getByTestId('advanced-dirty').uncheck();
                await page.getByTestId('advanced-close-self').click();
                await expectBaseline();
                continue;
            }

            // Completed path: avoid confirmation by setting dirty=false.
            await page.getByTestId('advanced-dirty').uncheck();

            await page.getByTestId('advanced-close-async-self').click();

            await expect(page.getByTestId('advanced-async-log')).toContainText('closeAsync: completed', {timeout: 15_000});
            await expectBaseline();
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
