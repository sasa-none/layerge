export * from './router/createLayergeRouter';
export {default as LayergeView} from './view/LayergeView.vue';
export {default as LayergeTransition} from './view/LayergeTransition.vue';
export {default as LayergeLink} from './components/LayergeLink.vue';
export * from './composables/usePresenter';
export * from './composables/useLayerge';
export * from './composables/usePresenterBindings';
export * from './composables/useLayergeLink';
export {usePresenterLeaveGuard} from './composables/usePresenterLeaveGuard';

// 公開型の再エクスポート。
// 手書きの index.d.ts が公開していた 25 型と 1 対 1 に対応させています。
// 増やすと公開 API の追加、減らすと削除にあたるため、機械的に照合しています。
export type {
    CreateLayergeRouterOptions,
    LayergeControlledHookContext,
    LayergeControlledHooks,
    LayergeEntryContext,
    LayergeEntryPhase,
    LayergeInvoker,
    LayergeLinkAttrs,
    LayergeLinkHookResult,
    LayergeLinkHooks,
    LayergeRouter,
    LayergeStore,
    PresenterApi,
    PresenterApis,
    PresenterAsyncResult,
    PresenterDefinition,
    PresenterDisplay,
    PresenterEntry,
    PresenterHandle,
    PresenterKind,
    PresenterMap,
    PresenterOpenOptions,
    PresenterPushReplaceOptions,
    PresenterTarget,
    UseLayergeLinkBindings,
    UseLayergeLinkHandlers
} from './types';
