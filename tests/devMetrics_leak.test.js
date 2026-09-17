import {describe, expect, it} from 'vitest';

import {createLayergeRouter} from '../layerge/router/createLayergeRouter';
import {__layergeGetDevMetrics} from '../layerge/internals/devMetrics.js';
import {createFakeRouter} from './_helpers/fakeRouter';

describe('internals/devMetrics (leak / growth)', () => {
    it('returns to baseline after repeated open/close + leaveDone', async () => {
        const router = createFakeRouter({initial: '/'});

        const wrapped = createLayergeRouter({
            router: router,
            presenters: {
                modal: {component: /** @type {any} */ ({})}
            },
            stack: true,
            cache: false
        });

        const baseline = __layergeGetDevMetrics(wrapped.$layerge);
        expect(baseline.entryCount).toBe(0);
        expect(baseline.leavingCount).toBe(0);
        expect(baseline.beforeunloadEnabled).toBe(false);

        for (let i = 0; i < 30; i++) {
            const handle = wrapped.modal.push(`/a-${i}`);
            await wrapped._flushNavigation();

            const entry = wrapped.$layerge.stack[0];
            const entryId = entry.id;

            // v1.x: Transition を使わない場合、enter は自動で完了する（nextTick）
            // テストでは手動 notify も許容する。
            if (entry.phase === 'enter') {
                wrapped.$layerge._notifyEnterDone(entryId);
            }

            handle.close();

            // leaving に保持され、leave 完了で解放される
            wrapped.$layerge._notifyLeaveDone(entryId);
            await handle.closed;

            const mid = __layergeGetDevMetrics(wrapped.$layerge);
            expect(mid.leavingCount).toBe(0);
        }

        const after = __layergeGetDevMetrics(wrapped.$layerge);
        expect(after.entryCount).toBe(0);
        expect(after.leavingCount).toBe(0);
        expect(after.beforeunloadEnabled).toBe(false);
    });
});
