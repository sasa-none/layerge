import {__layergeGetBeforeUnloadEnabled} from '../composables/usePresenterLeaveGuard.js';

/**
 * LayergeDevMetrics - dev-only 観測ポイント
 * @typedef {object} LayergeDevMetrics
 * @property {number} entryCount - entry 数（stack + kept）
 * @property {number} leavingCount - leaving 数
 * @property {boolean} beforeunloadEnabled - beforeunload が必要な状態か
 */

/**
 * __layergeGetDevMetrics - INTERNAL(dev-only): 観測ポイントを取得します
 *
 * NOTE: 公開APIではありません。外部利用を誘発しないため internals に閉じます。
 * @param {import('../types').LayergeStore} store - store
 * @returns {LayergeDevMetrics} metrics
 */
const __layergeGetDevMetrics = (store) => {
    const stackCount = Array.isArray(store.stack) ? store.stack.length : 0;
    const keptCount = Array.isArray(/** @type {any} */ (store)._kept)
        ? /** @type {any} */ (store)._kept.length
        : 0;
    const leavingCount = Array.isArray(store.leaving) ? store.leaving.length : 0;

    return {
        entryCount: stackCount + keptCount,
        leavingCount: leavingCount,
        beforeunloadEnabled: __layergeGetBeforeUnloadEnabled()
    };
};

export {__layergeGetDevMetrics};
