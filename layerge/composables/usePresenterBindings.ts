import {computed, inject} from 'vue';
import type {ComputedRef} from 'vue';

import {isNodeDevEnv} from '../internals/env.js';
import {EntryContextKey} from '../internals/keys.js';
import type {LayergeEntryContext} from '../types.js';

/**
 * usePresenterBindings - Presenter配下のEntryContextをもとに、v-bind用のbindingsを生成します
 *
 * 使用例:
 * const bindings = usePresenterBindings((ctx) => ({
 *   class: {isTop: ctx.isTop},
 *   style: {zIndex: 1000 + ctx.index}
 * }))
 * @param mapper - EntryContextから任意の形式のbindingsオブジェクトを生成するマッパー関数
 * @returns Vue.jsのv-bindディレクティブで使用可能なリアクティブbindingsオブジェクト
 * @throws {Error} Presenter配下以外で呼び出された場合にスロー（開発環境のみ）
 */
const usePresenterBindings = <T extends Record<string, unknown>>(
    mapper: (ctx: LayergeEntryContext) => T
): ComputedRef<T> => {
    const ctx = inject(EntryContextKey, null);

    // EntryContextが注入されていない場合の処理
    if (!ctx) {
        // 開発環境では明確に失敗させて誤用に気づけるようにする
        if (isNodeDevEnv()) {
            throw new Error(
                '[usePresenterBindings] EntryContext is not provided. Place this inside a presenter component.'
            );
        }

        // 本番環境では空のcomputedを返して破壊的クラッシュを避ける
        return computed(() => ({}) as T);
    }

    return computed(() => mapper(ctx));
};

export {usePresenterBindings};
