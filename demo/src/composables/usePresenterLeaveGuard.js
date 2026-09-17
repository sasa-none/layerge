import {onBeforeUnmount, onMounted, watchEffect} from 'vue';

import {usePresenterBindings} from '../../../layerge';

/**
 * Demo-only leave guard.
 *
 * Registers a per-entry guard into the global registry that is consulted by
 * demo/src/router.js controlledHooks.beforeClose.
 * @param {object} options - ガード設定
 * @param {import('vue').Ref<boolean>|boolean} options.dirty - 未保存の変更があるか
 * @param {() => (boolean|Promise<boolean>)} options.confirm - 続行してよいかの確認
 * @returns {void}
 */
export function usePresenterLeaveGuard({dirty, confirm}) {
    const entryId = usePresenterBindings((ctx) => ctx.id);

    const register = (id) => {
        if (!id) return () => {};

        window.__layergeLeaveGuards = window.__layergeLeaveGuards || new Map();

        window.__layergeLeaveGuards.set(id, async () => {
            if (!dirty?.value) return true;
            return await confirm();
        });

        return () => {
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
