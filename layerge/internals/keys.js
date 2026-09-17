/**
 * PresenterContextKey - Presenter 内で提供されるコンテキストキー
 * @type {import('vue').InjectionKey<unknown>}
 */
const PresenterContextKey = Symbol('Layerge.PresenterContext');

/**
 * EntryContextKey - Presenter 配下の最小ステート（EntryContext）を注入するためのキー
 * @type {import('vue').InjectionKey<import('../types').LayergeEntryContext>}
 */
const EntryContextKey = Symbol('Layerge.EntryContext');

/**
 * LayergeKey - LayergeStore を注入するためのキー
 * @type {import('vue').InjectionKey<import('../types').LayergeStore>}
 */
const LayergeKey = Symbol('Layerge.Store');

export {PresenterContextKey, EntryContextKey, LayergeKey};
