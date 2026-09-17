import {expect, test} from '@playwright/test';

const captureLayergeLogs = (page) => {
    /** @type {any[]} */
    const outcomes = [];
    /** @type {any[]} */
    const traces = [];

    page.on('console', async (msg) => {
        try {
            const args = msg.args();
            if (!args || args.length < 2) {
                return;
            }

            const tag = await args[0].jsonValue();
            if (tag === '[Layerge][outcome]') {
                const data = await args[1].jsonValue();
                outcomes.push({level: msg.type(), ...data});
            }

            if (tag === '[Layerge][trace]') {
                const data = await args[1].jsonValue();
                traces.push({level: msg.type(), ...data});
            }
        } catch {
            // ignore console parsing errors
        }
    });

    return {outcomes, traces};
};

test('DecisionTrace on-unexpected logs blocked (controlledHooks cancellation)', async ({page}) => {
    await page.addInitScript(() => {
        // dev-only opt-in
        globalThis.__LAYERGE_DECISION_TRACE_LEVEL = 'on-unexpected';
    });

    const {outcomes, traces} = captureLayergeLogs(page);

    await page.goto('/v3-advanced');

    // Enable cancellation for beforeNavigate (controlledHooks)
    await page.getByTestId('v3-cancel-navigate').check();

    // Trigger navigate (push) -> should be blocked by controlledHooks
    await page.getByTestId('v3-push').click();

    await expect.poll(() => outcomes.some((o) => o.status === 'blocked')).toBeTruthy();

    const blocked = outcomes.find((o) => o.status === 'blocked');
    expect(blocked).toBeTruthy();
    expect(blocked.traceId).toBeTruthy();
    expect(blocked.stage).toBeTruthy();

    await expect.poll(() => traces.some((t) => t.traceId === blocked.traceId)).toBeTruthy();

    const trace = traces.find((t) => t.traceId === blocked.traceId);
    expect(trace).toBeTruthy();
    expect(Array.isArray(trace.events)).toBeTruthy();

    // Must contain at least start + settle
    const types = trace.events.map((e) => e.type);
    expect(types).toContain('start');
    expect(types).toContain('settle');
});

test('DecisionTrace off does not emit outcome logs', async ({page}) => {
    await page.addInitScript(() => {
        // dev-only opt-in: explicitly off
        globalThis.__LAYERGE_DECISION_TRACE_LEVEL = 'off';
    });

    const {outcomes} = captureLayergeLogs(page);

    await page.goto('/v3-advanced');

    // Produce an "unexpected" outcome (superseded) that would log if on-unexpected/verbose
    await page.getByTestId('v3-push-async-slow').click();
    await page.waitForTimeout(50);
    await page.getByTestId('v3-push-async-fast').click();

    // Wait enough for async settle
    await page.waitForTimeout(1200);

    // No [Layerge][outcome] should be emitted at all when level=off
    expect(outcomes.length).toBe(0);
});
