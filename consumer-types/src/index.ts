/**
 * layerge の公開 API を、利用者と同じ解決方式（nodenext + ESM）で型検査するプローブです。
 *
 * 実行はしません（tsc --noEmit）。ここで検証しているのは「出荷する dist/types が
 * 利用者側で解決できるか」です。tarball からインストールした状態で検査するため、
 * package.json の exports / types の配線も同時に検証されます（ROADMAP A-19）。
 *
 * index.d.ts が export する 9 個の値と 24 個の型をすべて参照しています。
 * 公開エクスポートを増減させた場合は、このファイルも更新してください。
 */

import {
    createLayergeRouter,
    LayergeLink,
    LayergeTransition,
    LayergeView,
    useLayerge,
    useLayergeLink,
    usePresenter,
    usePresenterBindings,
    usePresenterLeaveGuard
} from 'layerge';

import type {
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
} from 'layerge';

import type {Component} from 'vue';
import type {Router} from 'vue-router';

/**
 * PublicValues - 値のエクスポート 9 個が解決されることを確認します
 */
type PublicValues = {
    createLayergeRouter: typeof createLayergeRouter;
    LayergeView: typeof LayergeView;
    LayergeTransition: typeof LayergeTransition;
    LayergeLink: typeof LayergeLink;
    usePresenter: typeof usePresenter;
    useLayerge: typeof useLayerge;
    usePresenterBindings: typeof usePresenterBindings;
    useLayergeLink: typeof useLayergeLink;
    usePresenterLeaveGuard: typeof usePresenterLeaveGuard;
};

/**
 * PublicTypes - 型のエクスポート 24 個が解決されることを確認します
 */
type PublicTypes = {
    createLayergeRouterOptions: CreateLayergeRouterOptions;
    layergeControlledHookContext: LayergeControlledHookContext;
    layergeControlledHooks: LayergeControlledHooks;
    layergeEntryContext: LayergeEntryContext;
    layergeEntryPhase: LayergeEntryPhase;
    layergeInvoker: LayergeInvoker;
    layergeLinkAttrs: LayergeLinkAttrs;
    layergeLinkHookResult: LayergeLinkHookResult;
    layergeLinkHooks: LayergeLinkHooks;
    layergeRouter: LayergeRouter;
    layergeStore: LayergeStore;
    presenterApi: PresenterApi;
    presenterApis: PresenterApis<PresenterMap>;
    presenterAsyncResult: PresenterAsyncResult;
    presenterDefinition: PresenterDefinition;
    presenterDisplay: PresenterDisplay;
    presenterEntry: PresenterEntry;
    presenterHandle: PresenterHandle;
    presenterKind: PresenterKind;
    presenterMap: PresenterMap;
    presenterOpenOptions: PresenterOpenOptions;
    presenterPushReplaceOptions: PresenterPushReplaceOptions;
    presenterTarget: PresenterTarget;
    useLayergeLinkBindings: UseLayergeLinkBindings;
    useLayergeLinkHandlers: UseLayergeLinkHandlers;
};

declare const router: Router;
declare const OverlayPresenter: Component;
declare const SettingsModal: Component;

// README のとおりの使い方が型として通ることを確認する
const layergeRouter = createLayergeRouter({
    router: router,
    debug: false,
    presenters: {
        modal: {component: OverlayPresenter, display: 'top'}
    },
    controlledHooks: {
        beforeOpen: (ctx: LayergeControlledHookContext) => ctx.action !== 'open'
    }
});

const handle: PresenterHandle = layergeRouter.modal.push(SettingsModal, {url: '/modal/settings'});

void handle.result.then((result: PresenterAsyncResult) => result.status);

// composable は setup 内で呼ぶものなので、ここでは戻り値の型だけを確認する
type LayergeState = ReturnType<typeof useLayerge>;
type PresenterState = ReturnType<typeof usePresenter>;
type LinkState = ReturnType<typeof useLayergeLink>;
type BindingsState = ReturnType<typeof usePresenterBindings<{index: number}>>;
type LeaveGuardState = ReturnType<typeof usePresenterLeaveGuard>;

export type {
    PublicValues,
    PublicTypes,
    LayergeState,
    PresenterState,
    LinkState,
    BindingsState,
    LeaveGuardState
};

export {layergeRouter, handle, LayergeView, LayergeTransition, LayergeLink};
