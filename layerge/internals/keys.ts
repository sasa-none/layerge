import type {InjectionKey} from 'vue';
import type {LayergeEntryContext, LayergeStore} from '../types';

/**
 * PresenterContextKey - Presenter 内で提供されるコンテキストキー
 */
const PresenterContextKey: InjectionKey<unknown> = Symbol('Layerge.PresenterContext');

/**
 * EntryContextKey - Presenter 配下の最小ステート（EntryContext）を注入するためのキー
 */
const EntryContextKey: InjectionKey<LayergeEntryContext> = Symbol('Layerge.EntryContext');

/**
 * LayergeKey - LayergeStore を注入するためのキー
 */
const LayergeKey: InjectionKey<LayergeStore> = Symbol('Layerge.Store');

export {PresenterContextKey, EntryContextKey, LayergeKey};
