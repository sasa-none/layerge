import {computed, onBeforeUnmount, unref, watchEffect} from 'vue';
import type {ComputedRef, Ref} from 'vue';
import {usePresenter} from './usePresenter.js';

/**
 * LeaveGuardRecord - Presenter 単位で保持する離脱ガード情報
 */
interface LeaveGuardRecord {
    /** 編集有無 */
    dirty: Ref<boolean> | boolean;
    /** 処理中 */
    pending: Ref<boolean> | boolean;
    /** pending=true の close 時に待つ Promise */
    commit?: (() => Promise<void>) | undefined;
    /** 既定 confirm に渡すメッセージ */
    message?: string | undefined;
    /** dirty=true の close 時に呼び出す確認 */
    confirm?: ((ctx: {entryId: string; reason: string}) => boolean | Promise<boolean>) | undefined;
}

/**
 * _registry - Presenter単位の離脱ガード情報を保持します
 * - usePresenterLeaveGuard() を使用したentryのみが登録されます
 * - Layergeコアは dirty / pending 状態を保持しません（Presenter責務）
 */
const _registry = new Map<string, LeaveGuardRecord>();

/**
 * _beforeUnloadCount - beforeunload を有効化すべき entry 数
 */
let _beforeUnloadCount = 0;

const _beforeUnloadListeners = new Set<(needed: boolean) => void>();

/**
 * notifyBeforeUnloadMaybe - beforeunload の必要性変化を通知します
 * @param next - 次のカウント
 */
const notifyBeforeUnloadMaybe = (next: number): void => {
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
 * @param listener - listener
 * @returns unsubscribe
 */
export const __layergeSubscribeBeforeUnload = (listener: (needed: boolean) => void): (() => void) => {
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
 * @returns 有効な場合 true
 */
export const __layergeGetBeforeUnloadEnabled = (): boolean => {
    return _beforeUnloadCount > 0;
};

/**
 * __layergeRunPresenterLeaveGuard - INTERNAL: close直前にPresenterの離脱ガードを実行します
 * - dirty=true の場合は confirm を要求できます
 * - pending=true の場合は commit（Promise）を待つことができます
 * @param args - args
 * @param args.entryId - 対象 entryId
 * @param args.reason - 呼び出し理由
 * @returns true: close 続行, false: close 中止
 */
export const __layergeRunPresenterLeaveGuard = async ({
    entryId,
    reason
}: {
    entryId: string;
    reason: string;
}): Promise<boolean> => {
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
 * @param entryId - entryId
 * @returns registered
 */
export const __layergeHasPresenterLeaveGuard = (entryId: string): boolean => {
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
 * @param opts - opts
 * @param opts.dirty - 編集有無
 * @param opts.pending - 処理中
 * @param opts.commit - pending=true の close 時に待つ Promise
 * @param opts.message - 既定 confirm に渡すメッセージ
 * @param opts.confirm - dirty=true の close 時に呼び出す確認
 * @returns entryId と、渡された dirty / pending
 */
export const usePresenterLeaveGuard = (
    opts: {
        dirty?: Ref<boolean> | boolean;
        pending?: Ref<boolean> | boolean;
        commit?: (() => Promise<void>) | undefined;
        message?: string;
        confirm?: (ctx: {entryId: string; reason: string}) => boolean | Promise<boolean>;
    } = {}
): {
    entryId: ComputedRef<string | null>;
    dirty: Ref<boolean> | boolean;
    pending: Ref<boolean> | boolean;
} => {
    const presenter = usePresenter();
    const entryId = computed(() => {
        return presenter && presenter.entry ? presenter.entry.id : null;
    });

    const dirty = opts.dirty !== undefined ? opts.dirty : false;
    const pending = opts.pending !== undefined ? opts.pending : false;

    const rec: LeaveGuardRecord = {
        dirty: dirty,
        pending: pending,
        commit: opts.commit,
        message: opts.message,
        confirm: opts.confirm
    };

    let lastId: string | null = null;

    let lastBeforeUnloadNeed = false;

    const cleanup = (): void => {
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
