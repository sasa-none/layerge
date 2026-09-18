import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';

import {createLayergeRouter} from '../layerge/router/createLayergeRouter';
import {createFakeRouter} from './_helpers/fakeRouter';

/**
 * close 時に URL 復元のナビゲーションが失敗した場合、診断用の error が
 * Outcome へ渡されることを固定します（ROADMAP A-12）。
 *
 * 以前は finalizeOutcome が第 3 引数を受け取っていながら捨てており、
 * [Layerge][error] のスタックが出力されていませんでした。
 */
describe('close outcome carries the navigation error (dev diagnostics)', () => {
    /** @type {any} */
    let errorSpy;

    beforeEach(() => {
        // dev かつ on-failure 以上でのみ診断ログが出る
        globalThis.__LAYERGE_DECISION_TRACE_LEVEL = 'on-failure';
        errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        vi.spyOn(console, 'warn').mockImplementation(() => {});
        vi.spyOn(console, 'info').mockImplementation(() => {});
        vi.spyOn(console, 'debug').mockImplementation(() => {});
    });

    afterEach(() => {
        delete globalThis.__LAYERGE_DECISION_TRACE_LEVEL;
        vi.restoreAllMocks();
    });

    it('logs the error object when URL restore fails on close', async () => {
        // 復元先（/）への遷移だけを失敗させる
        const router = createFakeRouter({
            initial: '/',
            fail: (to) => {
                return String(to) === '/';
            }
        });

        const wrapped = createLayergeRouter({
            router: router,
            presenters: {
                modal: {component: /** @type {any} */ ({})}
            },
            stack: true,
            cache: false
        });

        // replace-close は returnTo（ここでは '/'）へ復元するため、その遷移が失敗する
        const handle = wrapped.modal.replace('/page-a', {url: '/modal/a'});
        await wrapped._flushAllNavigations();

        handle.close();
        await wrapped._flushAllNavigations();

        const errorCalls = errorSpy.mock.calls.filter((args) => {
            return args[0] === '[Layerge][error]';
        });

        // 第 3 引数が捨てられていると、この 1 行は出力されない
        expect(errorCalls.length).toBeGreaterThan(0);

        const payload = errorCalls[0][1];
        expect(typeof payload.traceId).toBe('string');
        expect(payload.error).toBeTruthy();
    });
});
