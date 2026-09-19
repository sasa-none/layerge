import {describe, expect, it} from 'vitest';

import {createLayergeRouter} from '../layerge/router/createLayergeRouter';
import {createFakeRouter} from './_helpers/fakeRouter';

/**
 * createWrapped - 失敗経路を再現するためのルータを組み立てます
 * @param {{fail?: boolean|((to: any) => boolean)}} [options] - fakeRouter へ渡す設定
 * @returns {any} Layerge を適用したルータ
 */
const createWrapped = (options = {}) => {
    const router = createFakeRouter({initial: '/', ...options});

    const wrapped = createLayergeRouter({
        router: router,
        presenters: {
            modal: {component: /** @type {any} */ ({})}
        },
        display: 'stack'
    });

    return wrapped;
};

/**
 * result は公開契約として 4 値の文字列だけを返す。
 *
 * 失敗系の 2 経路（beforeEach の throw / afterEach の routerFailure）は、
 * 以前 status に Outcome オブジェクトそのものを入れていた（ROADMAP A-11）。
 * 成功系は文字列を返していたため、失敗系だけが壊れていた。
 */
describe('result on failure (public contract)', () => {
    it('resolves with the string "failed" when a guard throws', async () => {
        const wrapped = createWrapped();

        wrapped.beforeEach(() => {
            throw new Error('guard exploded');
        });

        const resultPromise = wrapped.modal.pushAsync('/page-a', {url: '/modal/a'});
        await wrapped._flushAllNavigations();

        const result = await resultPromise;

        // オブジェクトが入っていないことを固定する（欠陥の再発検知）
        expect(typeof result.status).toBe('string');
        expect(result).toEqual({status: 'failed'});
    });

    it('resolves with a string status when the router reports a failure', async () => {
        const wrapped = createWrapped({fail: true});

        const resultPromise = wrapped.modal.pushAsync('/page-a', {url: '/modal/a'});
        await wrapped._flushAllNavigations();

        const result = await resultPromise;

        expect(typeof result.status).toBe('string');
        expect(result).toEqual({status: 'aborted'});
    });

    it('exposes the same contract through handle.result', async () => {
        const wrapped = createWrapped();

        wrapped.beforeEach(() => {
            throw new Error('guard exploded');
        });

        const handle = wrapped.modal.push('/page-a', {url: '/modal/a'});
        await wrapped._flushAllNavigations();

        const result = await handle.result;

        expect(typeof result.status).toBe('string');
        expect(result).toEqual({status: 'failed'});
    });

    it('keeps the public status within the fixed four values', async () => {
        const wrapped = createWrapped({fail: true});

        const resultPromise = wrapped.modal.pushAsync('/page-a', {url: '/modal/a'});
        await wrapped._flushAllNavigations();

        const result = await resultPromise;

        expect(['completed', 'aborted', 'failed', 'superseded']).toContain(result.status);
    });
});
