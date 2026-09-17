import {markRaw, reactive} from 'vue';

/**
 * createLayergeStore - Layergeの内部状態を管理するリアクティブストアを作成します
 * @param {{[key: string]: import('../types').PresenterDefinition}} presenters - Presenter名をキーとする定義オブジェクトのマップ
 * @returns {import('../types').LayergeStore} リアクティブ化されたLayergeストアオブジェクト
 */
const createLayergeStore = (presenters) => {
    return reactive({
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
        _invokers: markRaw(new Map())
    });
};

export {createLayergeStore};
