import {__layergeGetBeforeUnloadEnabled} from '../composables/usePresenterLeaveGuard.js';
import type {LayergeStore} from '../types';

/**
 * LayergeDevMetrics - dev-only 観測ポイント
 */
export interface LayergeDevMetrics {
    /** entry 数（stack + kept） */
    entryCount: number;
    /** leaving 数 */
    leavingCount: number;
    /** beforeunload が必要な状態か */
    beforeunloadEnabled: boolean;
}

/**
 * __layergeGetDevMetrics - INTERNAL(dev-only): 観測ポイントを取得します
 *
 * NOTE: 公開APIではありません。外部利用を誘発しないため internals に閉じます。
 * @param store - store
 * @returns metrics
 */
const __layergeGetDevMetrics = (store: LayergeStore): LayergeDevMetrics => {
    const stackCount = Array.isArray(store.stack) ? store.stack.length : 0;

    const keptCount = Array.isArray(store._kept) ? store._kept.length : 0;

    const leavingCount = Array.isArray(store.leaving) ? store.leaving.length : 0;

    return {
        entryCount: stackCount + keptCount,
        leavingCount: leavingCount,
        beforeunloadEnabled: __layergeGetBeforeUnloadEnabled()
    };
};

export {__layergeGetDevMetrics};
