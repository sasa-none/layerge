import {markRaw, reactive} from 'vue';
import type {LayergeInvoker, LayergeStore, PresenterDefinition} from '../types';

/**
 * createLayergeStore - Layergeの内部状態を管理するリアクティブストアを作成します
 * @param presenters - Presenter名をキーとする定義オブジェクトのマップ
 * @returns リアクティブ化されたLayergeストアオブジェクト
 */
const createLayergeStore = (presenters: {[key: string]: PresenterDefinition}): LayergeStore => {
    const initial: LayergeStore = {
        mode: 'page',
        stack: [],
        leaving: [],
        // v3: keepMounted 用の保持領域（非表示でDOMを維持する）
        _kept: [],
        backgroundRoute: null,
        pending: null,
        internalNav: false,
        presenters: presenters,
        freezeBackground: false,
        stackEnabled: false,
        cacheEnabled: false,

        // v2: Invoker
        // - entryId と trigger DOM を結びつける最小コア
        // - リアクティブである必要はないため markRaw でラップ
        // NOTE: 破棄は createLayergeRouter 側で leave 完了と同期して行います
        _invokers: markRaw(new Map<string, LayergeInvoker>())
    };

    // reactive() の戻り値は UnwrapNestedRefs<T> となり、vue-router の
    // RouteLocationNormalizedLoaded を深く展開した結果が元の型と一致しない。
    // ref を含まないストアのため、実体は initial と同一である。
    return reactive(initial) as LayergeStore;
};

export {createLayergeStore};
