import {expect, test} from '@playwright/test';

test('v4: beforeEach throw is settled as failed (no pageerror)', async ({page}, testInfo) => {
    /** @type {Error[]} */
    const pageErrors = [];
    /** @type {{type: string, text: string}[]} */
    const oneLineOutcomes = [];

    page.on('pageerror', (err) => {
        pageErrors.push(err);
    });

    page.on('console', (msg) => {
        const text = msg.text();
        if (text.startsWith('[layerge] outcome')) {
            oneLineOutcomes.push({type: msg.type(), text: text});
        }
    });

    await page.addInitScript(() => {
        // dev-only opt-in
        // @ts-ignore
        globalThis.__LAYERGE_DECISION_TRACE_LEVEL = 'on-unexpected';
    });

    await page.goto('/v3-advanced?__fail=throw_guard');

    // Trigger a navigation (push via fakePath) which should fail by throwing in beforeEach.
    await page.getByTestId('v3-push').click();

    await expect.poll(() => oneLineOutcomes.some((l) => /status=failed\b/.test(l.text))).toBeTruthy();

    const failedLine = oneLineOutcomes.find((l) => /status=failed\b/.test(l.text));
    expect(failedLine).toBeTruthy();

    const traceIdMatch = failedLine.text.match(/traceId=([^\s]+)/);
    const traceId = traceIdMatch ? traceIdMatch[1] : '';
    expect(traceId).toBeTruthy();

    const dump = await page.evaluate(() => {
        // @ts-ignore
        return globalThis.__layergeDumpDecisionTraces?.({pretty: false, max: 50}) ?? '';
    });

    if (dump) {
        await testInfo.attach('decision_traces.json', {
            body: dump,
            contentType: 'application/json'
        });

        const parsed = JSON.parse(dump);
        expect(Array.isArray(parsed)).toBeTruthy();
        expect(parsed.some((t) => t && t.traceId === traceId)).toBeTruthy();
    }

    expect(pageErrors, 'pageerror should be empty').toEqual([]);
});
