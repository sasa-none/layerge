import {describe, expect, it} from 'vitest';
import {createLayergeRouter} from '../layerge/router/createLayergeRouter';
import {createFakeRouter} from './_helpers/fakeRouter';

describe('v3.x async API (opt-in)', () => {
    it('pushAsync resolves with completed after commit', async () => {
        const router = createFakeRouter({initial: '/'});

        const wrapped = createLayergeRouter({
            router: router,
            presenters: {
                modal: {component: /** @type {any} */ ({})}
            },
            stack: true,
            cache: false
        });

        const resultPromise = wrapped.modal.pushAsync('/page-a', {url: '/modal/a'});
        await wrapped._flushNavigation();

        await expect(resultPromise).resolves.toEqual({status: 'completed'});
        expect(wrapped.getLayergeState()).toEqual({mode: 'presenter', depth: 1});
    });

    it('pushAsync resolves superseded when a newer navigation starts', async () => {
        const router = createFakeRouter({
            initial: '/',
            delayMs: (to) => {
                // Make only A slow to keep it pending.
                return String(to).includes('slow-a') ? 200 : 0;
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

        const a = wrapped.modal.pushAsync('/slow-a', {url: '/modal/slow-a'});
        const b = wrapped.modal.pushAsync('/fast-b', {url: '/modal/fast-b'});

        await wrapped._flushAllNavigations();

        await expect(a).resolves.toEqual({status: 'superseded'});
        await expect(b).resolves.toEqual({status: 'completed'});
        expect(router.currentRoute.value.fullPath).toBe('/fast-b');
    });

    it('closeAsync returns completed for a valid top entryId', async () => {
        const router = createFakeRouter({initial: '/'});

        const wrapped = createLayergeRouter({
            router: router,
            presenters: {
                modal: {component: /** @type {any} */ ({})}
            },
            stack: true,
            cache: false
        });

        wrapped.modal.push('/page-a');
        await wrapped._flushNavigation();

        const entryId = wrapped.$layerge.stack[0].id;
        const res = await wrapped.modal.closeAsync(entryId);

        expect(res).toEqual({status: 'completed'});
        expect(wrapped.getLayergeState()).toEqual({mode: 'page', depth: 0});
    });

    it('closeAsync returns aborted for invalid entryId', async () => {
        const router = createFakeRouter({initial: '/'});

        const wrapped = createLayergeRouter({
            router: router,
            presenters: {
                modal: {component: /** @type {any} */ ({})}
            },
            stack: true,
            cache: false
        });

        const res = await wrapped.modal.closeAsync(/** @type {any} */ (''));
        expect(res).toEqual({status: 'aborted'});
    });
});
