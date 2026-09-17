import {expect, test} from '@playwright/test';

import {readStressIters} from './_helpers/stressEnv.js';

/**
 * Stress: repeat browser back/forward restore cycles.
 *
 * Goal: ensure repeated history navigation restores presenter correctly and does not crash.
 * Uses the existing home demo route (modal.push with fakePath).
 */

test('v4: repeated back/forward restore cycles do not crash and restore the same entryId', async ({page}, testInfo) => {
    const iters = readStressIters();

    // This is a stress-style E2E; give it more room than the default 30s.
    test.setTimeout(Math.max(90_000, iters * 4_000));

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

    await page.goto('/');

    const homeUrl = page.getByTestId('home-url');
    const overlay = page.getByTestId('overlay-presenter');
    const fakeContent = page.getByTestId('fakepath-content');
    const entryId = page.getByTestId('entry-id');

    const expectHome = async () => {
        await expect(page).toHaveURL(/\/$/);
        await expect(homeUrl).toHaveText('/');
        await expect(fakeContent).toHaveCount(0);
        await expect(overlay).toHaveCount(0);
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
        await expectHome();

        for (let i = 0; i < iters; i++) {
            currentIter = i;

            // Open fakePath presenter (URL will move to /fake/help)
            await page.getByTestId('modal-fakepath').click();

            await expect(page).toHaveURL(/\/fake\/help$/);
            await expect(fakeContent).toBeVisible({timeout: 15_000});
            await expect(overlay).toBeVisible({timeout: 15_000});

            const before = await entryId.textContent();

            // Back closes presenter.
            await page.goBack();
            await expectHome();

            // Forward restores presenter.
            await page.goForward();
            await expect(page).toHaveURL(/\/fake\/help$/);
            await expect(fakeContent).toBeVisible({timeout: 15_000});
            await expect(overlay).toBeVisible({timeout: 15_000});

            const after = await entryId.textContent();
            expect(after).toBe(before);

            // Close again to return to baseline for next iteration.
            await page.goBack();
            await expectHome();
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
