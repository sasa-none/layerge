import {computed, inject, nextTick, ref, watch} from 'vue';
import {useRouter} from 'vue-router';
import {LayergeKey} from '../internals/keys';
import {usePresenter} from './usePresenter';

/**
 * resolvePresenterName - presenter 名を決定します
 * - Presenter 上では entry.presenterName を優先します
 * - Page 上では modal があれば modal を優先します
 * - それ以外は presenters の先頭キーを使用します
 * @param {import('../types').LayergeStore|null} $layerge - Layergeストア
 * @param {import('../types').PresenterEntry|null} currentEntry - 現在のPresenterエントリ
 * @returns {string|null} presenter 名（決定できない場合は null）
 */
const resolvePresenterName = ($layerge, currentEntry) => {
    if ($layerge && currentEntry && typeof currentEntry.presenterName === 'string') {
        return currentEntry.presenterName;
    }

    if (!$layerge || !$layerge.presenters) {
        return null;
    }

    if ($layerge.presenters.modal) {
        return 'modal';
    }

    const names = Object.keys($layerge.presenters);

    if (names.length === 0) {
        return null;
    }

    return names[0];
};

/**
 * safeCallHook - hooks を安全に呼び出します
 * @param {import('../types').LayergeLinkHooks|undefined|null} hooks - hooks
 * @param {keyof import('../types').LayergeLinkHooks} key - hook名
 * @param {unknown[]} args - 引数
 * @returns {void}
 */
const safeCallHook = (hooks, key, args) => {
    if (!hooks) {
        return;
    }

    const fn = hooks[key];

    if (typeof fn !== 'function') {
        return;
    }

    try {
        fn(...args);
    } catch (e) {
        // hooks 例外で Layerge 本体を壊さない（凍結仕様）
        console.warn('[Layerge][useLayergeLink] hook error', key, e);
    }
};

/**
 * resolveInvokerElement - invoker に使用する DOM を決定します
 * @param {HTMLElement|null} refEl - ref で捕捉した要素
 * @param {unknown} event - click/keydown イベント
 * @returns {HTMLElement|null} DOM
 */
const resolveInvokerElement = (refEl, event) => {
    if (event && typeof event === 'object' && 'currentTarget' in event) {
        const t = event.currentTarget;

        if (t instanceof HTMLElement) {
            return t;
        }
    }

    if (refEl instanceof HTMLElement) {
        return refEl;
    }

    return null;
};

/**
 * findEntryById - stack / leaving から entryId を探します
 * @param {import('../types').LayergeStore} $layerge - Layergeストア
 * @param {string} entryId - entryId
 * @returns {import('../types').PresenterEntry|null} entry
 */
const findEntryById = ($layerge, entryId) => {
    const inStack = $layerge.stack.find((x) => x.id === entryId);

    if (inStack) {
        return inStack;
    }

    const inLeaving = $layerge.leaving.find((x) => x.id === entryId);

    if (inLeaving) {
        return inLeaving;
    }

    return null;
};

/**
 * inferEntryIdFromState - 直近の open 操作で作られた entryId を推測します
 * @param {import('../types').LayergeStore} $layerge - Layergeストア
 * @returns {string|null} entryId
 */
const inferEntryIdFromState = ($layerge) => {
    // push/replace で URL を動かす場合は pending に id が存在する
    if ($layerge.pending && typeof $layerge.pending.id === 'string') {
        return $layerge.pending.id;
    }

    // open / URL を動かさない push/replace は即 commit されるため stack の top を使う
    const top = $layerge.stack[$layerge.stack.length - 1];

    if (top && typeof top.id === 'string') {
        return top.id;
    }

    return null;
};

/**
 * useLayergeLink - RouterLink風の導線を composable として提供します
 * - invoker（entryId ↔ trigger DOM）を自動登録します
 * - hooks で opened/entered/closed 等を通知します（通知型・Promiseなし）
 * @param {import('../types').PresenterTarget} to - 遷移先（RouteLocationRaw | Component | loader）
 * @param {(() => import('../types').LayergeLinkAttrs)|undefined} [computeAttrs] - attrs 算出関数（任意）
 * @param {import('../types').LayergeLinkHooks|{hooks: import('../types').LayergeLinkHooks}|undefined} [hooks] - hooks（通知型）
 * @returns {import('../types').UseLayergeLinkResult} bindings と handlers
 */
const useLayergeLink = (to, computeAttrs, hooks) => {
    const router = useRouter();
    // In many apps, Layerge store is provided via injection.
    // But demo / lightweight setups may not provide it.
    // v2: allow fallback to router.$layerge so useLayergeLink works out-of-the-box.
    const $layerge = inject(LayergeKey, null) ?? inject('$layerge', null) ?? router?.$layerge ?? null;
    const presenterCtx = usePresenter();

    /**
     * normalizedHooks - 第3引数の互換性を吸収した hooks
     * - v2標準: useLayergeLink(to, computeAttrs, hooks)
     * - 互換: useLayergeLink(to, computeAttrs, {hooks})
     * @type {import('../types').LayergeLinkHooks|undefined}
     */
    const normalizedHooks =
        hooks && typeof hooks === 'object' && hooks !== null && 'hooks' in hooks && hooks.hooks && typeof hooks.hooks === 'object'
            ? hooks.hooks
            : hooks;

    /**
     * elRef - trigger DOM を捕捉します
     * @type {import('vue').Ref<HTMLElement|null>}
     */
    const elRef = ref(null);

    /**
     * opToken - 最新操作のトークン（latest-winsの無害化）
     * @type {import('vue').Ref<number>}
     */
    const opToken = ref(0);

    /**
     * currentEntryId - 直近の open によって生成された entryId
     * @type {import('vue').Ref<string|null>}
     */
    const currentEntryId = ref(null);

    /**
     * stopPhaseWatch - phase監視の解除関数
     * @type {(() => void)|null}
     */
    let stopPhaseWatch = null;

    /**
     * clearPhaseWatch - phase監視を解除します
     * @returns {void}
     */
    const clearPhaseWatch = () => {
        if (stopPhaseWatch) {
            stopPhaseWatch();
            stopPhaseWatch = null;
        }
    };

    /**
     * startPhaseWatch - phase 変化で entered/beforeClose を通知します
     * @param {string} entryId - 対象 entryId
     * @param {number} token - 操作トークン
     * @returns {void}
     */
    const startPhaseWatch = (entryId, token) => {
        if (!$layerge) {
            return;
        }

        clearPhaseWatch();

        let enteredNotified = false;
        let beforeCloseNotified = false;

        stopPhaseWatch = watch(
            () => {
                const entry = findEntryById($layerge, entryId);
                return entry ? entry.phase : null;
            },
            (phase) => {
                if (token !== opToken.value) {
                    return;
                }

                if (phase === 'active' && !enteredNotified) {
                    enteredNotified = true;
                    safeCallHook(normalizedHooks, 'entered', [{entryId: entryId}]);
                }

                if (phase === 'leave' && !beforeCloseNotified) {
                    beforeCloseNotified = true;
                    safeCallHook(normalizedHooks, 'beforeClose', [{entryId: entryId}]);
                }
            },
            {immediate: true}
        );
    };

    /**
     * openInternal - open/push/replace の共通処理
     * @param {'open'|'push'|'replace'} kind - 種別
     * @param {unknown} [event] - イベント
     * @returns {void}
     */
    const openInternal = (kind, event) => {
        opToken.value += 1;
        const token = opToken.value;

        safeCallHook(normalizedHooks, 'beforeOpen', []);

        // Layerge が使われていない場合は no-op
        if (!$layerge) {
            safeCallHook(normalizedHooks, 'openFailed', [new Error('[Layerge] Layerge store is not provided.')]);
            safeCallHook(normalizedHooks, 'settled', [{ok: false, stage: 'open'}]);
            return;
        }

        const presenterName = resolvePresenterName($layerge, presenterCtx.entry);

        if (!presenterName) {
            safeCallHook(normalizedHooks, 'openFailed', [new Error('[Layerge] Presenter is not resolved.')]);
            safeCallHook(normalizedHooks, 'settled', [{ok: false, stage: 'open'}]);
            return;
        }

        const api = router[presenterName];

        if (!api || typeof api[kind] !== 'function') {
            safeCallHook(
                normalizedHooks,
                'openFailed',
                [new Error(`[Layerge] Presenter API is not available: ${presenterName}.${kind}`)]
            );
            safeCallHook(normalizedHooks, 'settled', [{ok: false, stage: 'open'}]);
            return;
        }

        /** @type {HTMLElement|null} */
        const invokerEl = resolveInvokerElement(elRef.value, event);

        /** @type {import('../types').PresenterHandle|null} */
        let handle = null;

        try {
            handle = api[kind](to);
        } catch (e) {
            safeCallHook(normalizedHooks, 'openFailed', [e instanceof Error ? e : new Error(String(e))]);
            safeCallHook(normalizedHooks, 'settled', [{ok: false, stage: 'open', error: e}]);
            return;
        }

        /**
         * commitSuccess - open が成功した後の共通処理
         * @returns {void}
         */
        const commitSuccess = () => {
            const entryId = handle && (handle._id || handle.entryId) ? (handle._id || handle.entryId) : inferEntryIdFromState($layerge);
            currentEntryId.value = entryId;

            if (entryId && invokerEl && typeof $layerge._setInvoker === 'function') {
                $layerge._setInvoker(entryId, invokerEl);
            }

            // opened: open → nextTick の後
            nextTick().then(() => {
                if (token !== opToken.value) {
                    return;
                }

                safeCallHook(normalizedHooks, 'opened', [{entryId: entryId}]);
            });

            // entered/beforeClose: phase監視で通知
            if (entryId) {
                startPhaseWatch(entryId, token);
            }

            // closed/settled: close 完了で通知
            if (handle && handle.closed && typeof handle.closed.then === 'function') {
                handle.closed
                    .then(() => {
                        if (token !== opToken.value) {
                            return;
                        }

                        safeCallHook(normalizedHooks, 'closed', [{entryId: entryId}]);
                        safeCallHook(normalizedHooks, 'settled', [{ok: true, stage: 'close', entryId: entryId}]);
                    })
                    .catch((e) => {
                        if (token !== opToken.value) {
                            return;
                        }

                        safeCallHook(normalizedHooks, 'closeFailed', [e instanceof Error ? e : new Error(String(e))]);
                        safeCallHook(normalizedHooks, 'settled', [{ok: false, stage: 'close', entryId: entryId, error: e}]);
                    });
            }
        };

        // v2: push/replace の場合はガードキャンセル等で NavigationFailure が返る場合がある。
        // - 成功時のみ opened/entered を通知する
        // - 失敗時は openFailed → settled(ng:open) のみ
        if ((kind === 'push' || kind === 'replace') && handle && handle._navPromise && typeof handle._navPromise.then === 'function') {
            handle._navPromise
                .then((failure) => {
                    if (token !== opToken.value) {
                        return;
                    }

                    if (failure) {
                        clearPhaseWatch();
                        currentEntryId.value = null;

                        safeCallHook(normalizedHooks, 'openFailed', [failure]);
                        safeCallHook(normalizedHooks, 'settled', [{ok: false, stage: 'open', failure: failure}]);
                        return;
                    }

                    commitSuccess();
                })
                .catch((e) => {
                    if (token !== opToken.value) {
                        return;
                    }

                    safeCallHook(normalizedHooks, 'openFailed', [e instanceof Error ? e : new Error(String(e))]);
                    safeCallHook(normalizedHooks, 'settled', [{ok: false, stage: 'open', error: e}]);
                });

            return;
        }

        // open / URL unchanged push/replace (no navigation) は即時成功
        commitSuccess();
    };

    /**
     * bindings - DOM 向け bindings
     * @type {import('vue').ComputedRef<import('../types').UseLayergeLinkBindings>}
     */
    const bindingsComputed = computed(() => {
        /** @type {import('../types').LayergeLinkAttrs} */
        let attrs = {};

        if (typeof computeAttrs === 'function') {
            try {
                attrs = computeAttrs();
            } catch (e) {
                console.warn('[Layerge][useLayergeLink] computeAttrs error', e);
            }
        }

        // NOTE:
        // useLayergeLink は UI/A11y を保証しない方針のため、イベントハンドラ（onClick/onKeydown 等）は返しません。
        // 利用者は @click / v-on を用いて handler を明示的に紐づけます。
        return {
            ref: elRef,
            ...attrs
        };
    });

    /**
     * handlers - 明示的な操作用ハンドラ
     * @type {import('../types').UseLayergeLinkHandlers}
     */
    const handlers = {
        open: (event) => {
            openInternal('open', event);
        },
        push: (event) => {
            openInternal('push', event);
        },
        replace: (event) => {
            openInternal('replace', event);
        }
    };

    // NOTE:
    // Vue templates may not always unwrap ComputedRef values when used in `v-bind="..."`.
    // Returning a getter provides a plain object for v-bind while still keeping the internal
    // computation reactive.
    return {
        get bindings() {
            return bindingsComputed.value;
        },
        // v2: keep both `handler` and `handlers` for ergonomics/compat.
        handler: handlers,
        handlers: handlers
    };
};

export {useLayergeLink};
