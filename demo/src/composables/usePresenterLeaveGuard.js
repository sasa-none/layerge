import {onBeforeUnmount, onMounted, watchEffect} from 'vue';

import {usePresenterBindings} from '../../../layerge';

/**
 * Demo-only leave guard.
 *
 * Registers a per-entry guard into the global registry that is consulted by
 * demo/src/router.js controlledHooks.beforeClose.
 */
export function usePresenterLeaveGuard({dirty, confirm}) {
    const entryId = usePresenterBindings((ctx) => ctx.id);

    const register = (id) => {
        if (!id) return () => {};

        // eslint-disable-next-line no-underscore-dangle
        window.__layergeLeaveGuards = window.__layergeLeaveGuards || new Map();

        // eslint-disable-next-line no-underscore-dangle
        window.__layergeLeaveGuards.set(id, async () => {
            if (!dirty?.value) return true;
            return await confirm();
        });

        return () => {
            // eslint-disable-next-line no-underscore-dangle
            window.__layergeLeaveGuards?.delete(id);
        };
    };

    let cleanup = () => {};

    onMounted(() => {
        watchEffect((onCleanup) => {
            cleanup();
            cleanup = register(entryId.value);
            onCleanup(() => cleanup());
        });
    });

    onBeforeUnmount(() => cleanup());
}
