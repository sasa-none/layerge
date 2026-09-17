import {computed, onBeforeUnmount, unref, watchEffect} from 'vue';
import {usePresenter} from './usePresenter.js';

/**
 * _registry - Presenter単位の離脱ガード情報を保持します
 * - usePresenterLeaveGuard() を使用したentryのみが登録されます
 * - Layergeコアは dirty / pending 状態を保持しません（Presenter責務）
 * @type {Map<string, {
 *  dirty: import('vue').Ref<boolean>|boolean,
 *  pending: import('vue').Ref<boolean>|boolean,
 *  commit?: (() => Promise<void>)|undefined,
 *  message?: string|undefined,
 *  confirm?: ((ctx:{entryId:string, reason:string}) => (boolean|Promise<boolean>))|undefined
 * }>}
 */
const _registry = new Map();

/**
 * _beforeUnloadCount - beforeunload を有効化すべき entry 数
 * @type {number}
 */
let _beforeUnloadCount = 0;

/** @type {Set<(needed: boolean) => void>} */
const _beforeUnloadListeners = new Set();

/**
 * notifyBeforeUnloadMaybe - beforeunload の必要性変化を通知します
 * @param {number} next - 次のカウント
 * @returns {void}
 */
const notifyBeforeUnloadMaybe = (next) => {
    const prevNeeded = _beforeUnloadCount > 0;
    const nextNeeded = next > 0;

    _beforeUnloadCount = next;

    if (prevNeeded === nextNeeded) {
        return;
    }

    for (const fn of _beforeUnloadListeners) {
        try {
            fn(nextNeeded);
        } catch {
            // ignore
        }
    }
};

/**
 * __layergeSubscribeBeforeUnload - INTERNAL: beforeunload の必要性変化を購読します
 * @param {(needed: boolean) => void} listener - listener
 * @returns {() => void} unsubscribe
 */
export const __layergeSubscribeBeforeUnload = (listener) => {
    _beforeUnloadListeners.add(listener);

    try {
        listener(_beforeUnloadCount > 0);
    } catch {
        // ignore
    }

    return () => {
        _beforeUnloadListeners.delete(listener);
    };
};

/**
 * __layergeGetBeforeUnloadEnabled - INTERNAL: beforeunload が必要な状態かを取得します
 * @returns {boolean} 有効な場合 true
 */
export const __layergeGetBeforeUnloadEnabled = () => {
    return _beforeUnloadCount > 0;
};

/**
 * __layergeRunPresenterLeaveGuard - INTERNAL: close直前にPresenterの離脱ガードを実行します
 * - dirty=true の場合は confirm を要求できます
 * - pending=true の場合は commit（Promise）を待つことができます
 * @param {{entryId: string, reason: string}} args - args
 * @returns {Promise<boolean>} true: close 続行, false: close 中止
 */
export const __layergeRunPresenterLeaveGuard = async ({entryId, reason}) => {
    const rec = _registry.get(entryId);

    if (!rec) {
        return true;
    }

    try {
        const isPending = !!unref(rec.pending);

        // v3.1: pending=true の場合は commit を待つ（Presenter責務）
        if (isPending) {
            if (typeof rec.commit === 'function') {
                try {
                    await rec.commit();
                } catch {
                    // commit が失敗した場合は close を止める（UIはPresenter側で行う）
                    return false;
                }
            }
        }

        const dirty = !!unref(rec.dirty);
        if (!dirty) {
            return true;
        }

        // カスタムconfirm（sync/async）
        if (typeof rec.confirm === 'function') {
            const ok = await rec.confirm({entryId: entryId, reason: reason});
            return !!ok;
        }

        // 既定: window.confirm
        if (typeof window !== 'undefined' && typeof window.confirm === 'function') {
            return window.confirm(rec.message || 'Are you sure you want to leave?');
        }

        // SSR等: 安全側として許可
        return true;
    } catch {
        // guard 例外で close を阻害しない
        return true;
    }
};

/**
 * __layergeHasPresenterLeaveGuard - INTERNAL: entryId に leaveGuard が登録されているか
 * @param {string} entryId - entryId
 * @returns {boolean} registered
 */
export const __layergeHasPresenterLeaveGuard = (entryId) => {
    return _registry.has(entryId);
};

/**
 * usePresenterLeaveGuard - Presenter の離脱ガードを登録します
 *
 * - dirty: 編集有無（Presenter責務）
 * - pending: 処理中（Presenter責務）
 * - commit: pending=true の close 時に待つPromise（Presenter責務）
 * - confirm: dirty=true の close 時に呼び出す確認（Presenter責務）
 *
 * Layergeは confirm UI を提供しません。
 * @param {{
 *  dirty?: import('vue').Ref<boolean>|boolean,
 *  pending?: import('vue').Ref<boolean>|boolean,
 *  commit?: (() => Promise<void>)|undefined,
 *  message?: string,
 *  confirm?: (ctx:{entryId:string, reason:string}) => (boolean|Promise<boolean>)
 * }} [opts] - opts
 * @returns {{entryId: import('vue').ComputedRef<string|null>, dirty: import('vue').Ref<boolean>|boolean, pending: import('vue').Ref<boolean>|boolean}}
 */
export const usePresenterLeaveGuard = (opts = {}) => {
    const presenter = usePresenter();
    const entryId = computed(() => {
        return presenter && presenter.entry ? presenter.entry.id : null;
    });

    const dirty = opts.dirty !== undefined ? opts.dirty : false;
    const pending = opts.pending !== undefined ? opts.pending : false;

    const rec = {
        dirty: dirty,
        pending: pending,
        commit: opts.commit,
        message: opts.message,
        confirm: opts.confirm
    };

    /** @type {string|null} */
    let lastId = null;

    /** @type {boolean} */
    let lastBeforeUnloadNeed = false;

    const cleanup = () => {
        if (lastId === null) {
            return;
        }

        const current = _registry.get(lastId);
        if (current === rec) {
            _registry.delete(lastId);
        }

        if (lastBeforeUnloadNeed) {
            lastBeforeUnloadNeed = false;
            notifyBeforeUnloadMaybe(Math.max(0, _beforeUnloadCount - 1));
        }

        lastId = null;
    };

    watchEffect((onInvalidate) => {
        const id = entryId.value;
        if (id == null) {
            return;
        }

        if (lastId !== null && lastId !== id) {
            cleanup();
        }

        lastId = id;
        _registry.set(id, rec);

        const needBeforeUnload = !!unref(dirty) || !!unref(pending);
        if (needBeforeUnload !== lastBeforeUnloadNeed) {
            lastBeforeUnloadNeed = needBeforeUnload;
            notifyBeforeUnloadMaybe(_beforeUnloadCount + (needBeforeUnload ? 1 : -1));
        }

        onInvalidate(() => {
            cleanup();
        });
    });

    onBeforeUnmount(() => {
        cleanup();
    });

    return {
        entryId: entryId,
        dirty: dirty,
        pending: pending
    };
};
