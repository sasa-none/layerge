import {expect, test} from '@playwright/test';

const captureOutcomes = (page) => {
    /** @type {any[]} */
    const outcomes = [];
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
        } catch {
            // ignore
        }
    });
    return outcomes;
};

test('DecisionTrace on-unexpected logs superseded (latest-wins)', async ({page}) => {
    await page.addInitScript(() => {
        globalThis.__LAYERGE_DECISION_TRACE_LEVEL = 'on-unexpected';
    });

    const outcomes = captureOutcomes(page);

    await page.goto('/advanced');

    await page.getByTestId('advanced-push-async-slow').click();
    await page.waitForTimeout(50);
    await page.getByTestId('advanced-push-async-fast').click();

    await expect.poll(() => outcomes.some((o) => o.status === 'superseded')).toBeTruthy();

    const sup = outcomes.find((o) => o.status === 'superseded');
    expect(sup).toBeTruthy();
    expect(sup.traceId).toBeTruthy();
    expect(sup.stage).toBeTruthy();
});
