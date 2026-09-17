import {getCurrentInstance, onBeforeUnmount, ref, unref, watchEffect} from 'vue';
import {useRouter} from 'vue-router';

/**
 * Presenter 内で close/navigate を止めるための Local guard を登録します（opt-in）。
 *
 * - 複数登録OK / AND判定（1つでも false なら中止）
 * - v3: Local guard → Global controlledHooks の順で判定されます
 *
 * NOTE:
 * - entryId の自動解決は「Presenter 内で Layerge が提供する entry context」を前提にします。
 *   現状、明示指定（options.entryId）を推奨します。
 * @param {object} options
 * @param {string} [options.entryId] - 対象PresenterのentryId（推奨: 明示指定）
 * @param {boolean|import('vue').Ref<boolean>|(() => boolean)} options.when - ガードを有効化する条件
 * @param {() => (boolean|Promise<boolean>)} options.confirm - true で続行 / false で中止
 * @param {boolean} [options.guardSpaNavigation] - 将来拡張用（v3.0最小では close 判定中心）
 * @returns {{dispose: () => void, isRegistered: import('vue').Ref<boolean>}}
 */
export function usePresenterLeaveGuard(options) {
    const router = useRouter();
    const isRegistered = ref(false);

    if (!options || typeof options !== 'object') {
        return {dispose: () => {}, isRegistered};
    }

    const entryId = options.entryId || null;

    const getEntryIdFallback = () => {
        // Best-effort fallback: allow framework integration to stash entryId on instance.
        // (This is intentionally soft; we do not want to add public EntryContext state.)
        const inst = getCurrentInstance();
        const anyProxy = inst && inst.proxy ? inst.proxy : null;
        return anyProxy && typeof anyProxy.$layergeEntryId === 'string' ? anyProxy.$layergeEntryId : null;
    };

    const resolveEntryId = () => {
        return entryId || getEntryIdFallback();
    };

    /** @type {null|(() => void)} */
    let dispose = null;

    const unregister = () => {
        if (dispose) {
            try {
                dispose();
            } finally {
                dispose = null;
                isRegistered.value = false;
            }
        }
    };

    onBeforeUnmount(() => {
        unregister();
    });

    // Keep registration in sync with entryId availability.
    watchEffect(() => {
        const id = resolveEntryId();
        const canRegister = !!(
            id &&
            router &&
            router.$layerge &&
            typeof router.$layerge.registerLeaveGuard === 'function'
        );

        if (!canRegister) {
            unregister();
            return;
        }

        // Re-register if entryId changes.
        unregister();

        dispose = router.$layerge.registerLeaveGuard(id, async () => {
            const w = options.when;
            const active = typeof w === 'function' ? !!w() : !!unref(w);

            if (!active) {
                return true;
            }

            try {
                const ok = await options.confirm();
                return !!ok;
            } catch {
                // fail-safe: cancel
                return false;
            }
        });

        isRegistered.value = true;
    });

    return {dispose: unregister, isRegistered};
}
