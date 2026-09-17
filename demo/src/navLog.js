import {ref} from 'vue';
import {isNavigationFailure, NavigationFailureType} from 'vue-router';

/**
 * @typedef {{
 *     action: string,
 *     toFullPath: string,
 *     updateUi: boolean,
 *     logOnly: boolean,
 *     expectSuperseded: boolean
 * }} PendingTrack
 */

const lastAction = ref('');
const lastResult = ref('');

/** @type {import('vue-router').Router | null} */
let boundRouter = null;
/** @type {() => void | null} */
let removeAfterEach = null;

/** @type {import('vue').Ref<Array<PendingTrack>>} */
const pendingTracks = ref([]);

/**
 * initNavLog
 * Register a single global router.afterEach to capture navigation results,
 * without depending on HomePage lifecycle.
 * @param {import('vue-router').Router} router - Vue Routerインスタンス
 * @returns {void}
 */
const initNavLog = (router) => {
    if (boundRouter) {
        return;
    }

    boundRouter = router;

    removeAfterEach = router.afterEach((to, from, failure) => {
        if (pendingTracks.value.length === 0) {
            return;
        }

        const toPath = to.fullPath;

        /** @type {Array<PendingTrack>} */
        const matched = [];
        /** @type {Array<PendingTrack>} */
        const remain = [];

        for (const t of pendingTracks.value) {
            if (t.toFullPath === toPath) {
                matched.push(t);
            } else {
                remain.push(t);
            }
        }

        pendingTracks.value = remain;

        if (matched.length === 0) {
            return;
        }

        for (const t of matched) {
            const label = formatResultLabel({failure: failure, expectSuperseded: t.expectSuperseded});
            if (label === '') {
                if (t.updateUi) {
                    lastResult.value = `resolved: ${toPath}`;
                }

                if (!t.logOnly) {
                    // デモの動作確認用に意図して log を出す（console.log はここだけ）
                    // eslint-disable-next-line no-console
                    console.log(`[demo] navigation resolved: ${t.action}`, {from: from.fullPath, to: toPath});
                }

                continue;
            }

            if (t.updateUi) {
                lastResult.value = `failed: ${label}`;
            }

            console.warn(`[demo] navigation failed: ${t.action}`, {
                from: from.fullPath,
                to: toPath,
                reason: label,
                failure: failure
            });
        }
    });
};

/**
 * disposeNavLog
 * @returns {void}
 */
const disposeNavLog = () => {
    if (removeAfterEach) {
        removeAfterEach();
        removeAfterEach = null;
    }

    boundRouter = null;
};

/**
 * trackNavigation
 * Register an action label and the expected to.fullPath to capture its result in afterEach.
 * @param {string} action - 実行するアクション名
 * @param {string} toFullPath - 遷移先のfullPath
 * @param {{
 *     updateUi?: boolean,
 *     logOnly?: boolean,
 *     expectSuperseded?: boolean
 * }} [options] - オプション設定
 * @returns {void}
 */
const trackNavigation = (action, toFullPath, options = {}) => {
    const updateUi = options.updateUi !== false;
    const logOnly = options.logOnly === true;
    const expectSuperseded = options.expectSuperseded === true;

    pendingTracks.value.push({
        action: action,
        toFullPath: toFullPath,
        updateUi: updateUi,
        logOnly: logOnly,
        expectSuperseded: expectSuperseded
    });
};

/**
 * reportRenderError
 * For errors that happen after navigation, e.g., async component loader rejects.
 * @param {string} action - 実行したアクション名
 * @param {unknown} error - 発生したエラー
 * @returns {void}
 */
const reportRenderError = (action, error) => {
    const message = error instanceof Error ? error.message : String(error);
    lastAction.value = action;
    lastResult.value = `rejected: ${message}`;

    console.error(`[demo] render error: ${action}`, {error: error});
};

/**
 * formatResultLabel - ナビゲーション結果のラベルをフォーマットします
 * @param {{
 *     failure: unknown,
 *     expectSuperseded: boolean
 * }} args - フォーマット用の引数オブジェクト
 * @returns {string} フォーマットされた結果ラベル
 */
const formatResultLabel = (args) => {
    const failure = args.failure;

    if (!failure) {
        return '';
    }

    // When Layerge cancels a stale navigation via next(false),
    // vue-router reports it as "aborted". For demo clarity, we label it as "cancelled (superseded ...)"
    // if the action is known to be superseded.
    if (args.expectSuperseded) {
        try {
            if (
                isNavigationFailure(failure, NavigationFailureType.aborted) ||
                isNavigationFailure(failure, NavigationFailureType.cancelled)
            ) {
                return 'cancelled (superseded by a newer navigation)';
            }
        } catch {
            return 'cancelled (superseded by a newer navigation)';
        }
    }

    try {
        if (isNavigationFailure(failure, NavigationFailureType.aborted)) {
            return 'aborted (guard returned false)';
        }

        if (isNavigationFailure(failure, NavigationFailureType.cancelled)) {
            return 'cancelled (superseded by a newer navigation)';
        }

        if (isNavigationFailure(failure, NavigationFailureType.duplicated)) {
            return 'duplicated (already at the same location)';
        }
    } catch {
        // fallthrough
    }

    return 'unknown navigation failure';
};

export {initNavLog, disposeNavLog, trackNavigation, reportRenderError, lastAction, lastResult};
