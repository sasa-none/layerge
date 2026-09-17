import {expect, test} from '@playwright/test';

test('v4.1: dev+opt-in で dump/get が利用でき、failed 時に固定1行ログと導線が出る', async ({page}, testInfo) => {
    /** @type {Error[]} */
    const pageErrors = [];
    /** @type {{type: string, text: string}[]} */
    const oneLineOutcomes = [];
    /** @type {{type: string, text: string}[]} */
    const hints = [];

    page.on('pageerror', (err) => {
        pageErrors.push(err);
    });

    page.on('console', (msg) => {
        const text = msg.text();
        if (text.startsWith('[layerge] outcome')) {
            oneLineOutcomes.push({type: msg.type(), text: text});
        }
        if (text.startsWith('[layerge] hint')) {
            hints.push({type: msg.type(), text: text});
        }
    });

    await page.addInitScript(() => {
        // dev-only opt-in
        // @ts-ignore
        globalThis.__LAYERGE_DECISION_TRACE_LEVEL = 'on-unexpected';
    });

    // reject_push は demo router の push/replace を reject させるためのスイッチ
    // （beforeEach の throw/reject とは別系統で、初期ロードを壊さない）
    await page.goto('/?__fail=reject_push');

    // globalThis 露出（dev-only / opt-in）
    const globals = await page.evaluate(() => {
        // @ts-ignore
        return {
            hasGet: typeof globalThis.__layergeGetDecisionTraces === 'function',
            hasDump: typeof globalThis.__layergeDumpDecisionTraces === 'function'
        };
    });
    expect(globals.hasGet).toBeTruthy();
    expect(globals.hasDump).toBeTruthy();

    // Trigger a navigation via UI (home modal.push('/page-a'))
    await page.getByTestId('modal-push').click();

    // fixed format 1-line outcome must appear
    await expect
        .poll(() => oneLineOutcomes.some((l) => /\btraceId=\S+\b/.test(l.text) && /\bstatus=failed\b/.test(l.text)))
        .toBeTruthy();

    const failedLine = oneLineOutcomes.find((l) => /\bstatus=failed\b/.test(l.text));
    expect(failedLine).toBeTruthy();
    expect(failedLine.text).toMatch(
        /^\[layerge\] outcome traceId=\S+ stage=\S+ status=\S+ public=\S+ reason=(\S+|-)$/
    );

    const traceIdMatch = failedLine.text.match(/traceId=([^\s]+)/);
    const traceId = traceIdMatch ? traceIdMatch[1] : '';
    expect(traceId).toBeTruthy();

    // failed 時は dump 導線が見える
    await expect
        .poll(() => hints.some((h) => new RegExp(`traceId=${traceId}`).test(h.text) && /dump=__layergeDumpDecisionTraces\(\)/.test(h.text)))
        .toBeTruthy();

    // dump が JSON として貼れる（traceId が含まれること）
    const dump = await page.evaluate(() => {
        // @ts-ignore
        return globalThis.__layergeDumpDecisionTraces?.({pretty: false, max: 50}) ?? '';
    });

    expect(typeof dump).toBe('string');
    expect(dump.length).toBeGreaterThan(0);

    await testInfo.attach('decision_traces_on_failure.json', {
        body: dump,
        contentType: 'application/json'
    });

    const parsed = JSON.parse(dump);
    expect(Array.isArray(parsed)).toBeTruthy();
    expect(parsed.some((t) => t && t.traceId === traceId)).toBeTruthy();

    // get も使える
    const traces = await page.evaluate(() => {
        // @ts-ignore
        return globalThis.__layergeGetDecisionTraces?.() ?? null;
    });
    expect(Array.isArray(traces)).toBeTruthy();

    expect(pageErrors, 'pageerror should be empty').toEqual([]);
});
