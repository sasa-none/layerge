import type {Component, ComputedRef, Ref} from 'vue';
import type {RouteLocationNormalizedLoaded, RouteLocationRaw, Router} from 'vue-router';

export type PresenterKind = 'push' | 'replace' | 'open';

export type PresenterDisplay = 'top' | 'stack' | 'stack+cache';

export type LayergeEntryPhase = 'enter' | 'active' | 'leave';

export interface LayergeEntryContext {
    entryId: string;
    phase: LayergeEntryPhase;
    index: number;
    depth: number;
    isTop: boolean;
}

export interface PresenterHandle {
    close(): void;
    readonly closed: Promise<void>;
    /** v3.2: opt-in async（確定結果のみ返す） */
    readonly settled: Promise<PresenterAsyncResult>;
    readonly isActive: boolean;
}

export interface PresenterAsyncResult {
    status: 'completed' | 'aborted' | 'failed' | 'superseded';
}

export interface PresenterDefinition {
    component: Component;
    /** display mode (recommended). If provided, it overrides stack/cache. */
    display?: PresenterDisplay;
    stack?: boolean;
    cache?: boolean;
}

export interface PresenterEntry {
    id: string;
    /** phase in v1.x state machine */
    phase?: 'enter' | 'active' | 'leave';
    /** @internal - index snapshot when leaving */
    _leavingIndex?: number;
    /** @internal - depth snapshot when leaving */
    _leavingDepth?: number;
    presenterName: string;
    kind: PresenterKind;
    /** close 時に適用するナビ種別（URL を動かした場合のみ push/replace） */
    navType: PresenterKind;
    /** replace-close の戻り先（from.fullPath）。不要な場合は null。 */
    returnTo: string | null;
    route: RouteLocationNormalizedLoaded;
    /** Component/loader target の場合に使用される描画用コンポーネント */
    viewComponent?: Component | null;
    handle: PresenterHandle;
}

export type PresenterTarget = RouteLocationRaw | Component | (() => Promise<any>);

export interface PresenterPushReplaceOptions {
    /**
     * push/replace のみ：URL を指定します（Presenter は Component/loader でも OK）
     */
    url?: string | RouteLocationRaw;

    /**
     * @deprecated v3.0: url へ移行しました（互換のために残しています）
     */
    fakePath?: string;

    /** v3.0: true の場合、表示前にDOMが存在してよい（最小のhidden制御のみ） */
    preMounted?: boolean;
    /** v3.0: true の場合、close時にアンマウントせず非表示のみを行います */
    keepMounted?: boolean;
    /** v3.0: mount設定プリセット（preMounted/keepMountedを上書き） */
    mountPreset?: 'default' | 'keep' | 'pre' | 'prekeep';
}

/** open の options には fakePath を含めない（誤用を型で抑止） */
export interface PresenterOpenOptions {
    /** v3.0: true の場合、表示前にDOMが存在してよい（最小のhidden制御のみ） */
    preMounted?: boolean;
    /** v3.0: true の場合、close時にアンマウントせず非表示のみを行います */
    keepMounted?: boolean;
    /** v3.0: mount設定プリセット（preMounted/keepMountedを上書き） */
    mountPreset?: 'default' | 'keep' | 'pre' | 'prekeep';
}

export interface LayergeStore {
    mode: 'page' | 'presenter';
    stack: PresenterEntry[];
    leaving: PresenterEntry[];
    backgroundRoute: RouteLocationNormalizedLoaded | null;
    freezeBackground: boolean;

    presenters: Record<string, {component: Component; stack: boolean; cache: boolean; display: PresenterDisplay}>;
    stackEnabled: boolean;
    cacheEnabled: boolean;

    /** @internal */
    pending: unknown;
    /** @internal */
    _exitPresenterMode?: () => void;
    /** @internal */
    _closeTop?: (options?: {restoreUrl?: boolean}) => void;
    /** @internal */
    _closeAll?: (options?: {restoreUrl?: boolean}) => void;
    /** @internal */
    _closeById?: (id: string, options?: {restoreUrl?: boolean}) => void;
    /** @internal */
    _notifyEnterDone?: (entryId: string) => void;
    /** @internal */
    _notifyLeaveDone?: (entryId: string) => void;

    /** @internal - v2 */
    _setInvoker?: (entryId: string, el: HTMLElement) => void;
    /** @internal - v2 */
    _getInvoker?: (entryId: string) => LayergeInvoker | null;
    /** @internal - v2 */
    _deleteInvoker?: (entryId: string) => void;
}

export interface LayergeInvoker {
    entryId: string;
    el: HTMLElement;
}

export interface PresenterApi {
    push(target: PresenterTarget, options?: PresenterPushReplaceOptions): PresenterHandle;
    /** v3.2: opt-in async（確定結果のみ返す） */
    pushAsync(target: PresenterTarget, options?: PresenterPushReplaceOptions): Promise<PresenterAsyncResult>;
    replace(target: PresenterTarget, options?: PresenterPushReplaceOptions): PresenterHandle;
    open(target: PresenterTarget, options?: PresenterOpenOptions): PresenterHandle;
    /** v3.2: opt-in async（close の確定結果のみ返す） */
    closeAsync(entryId: string, options?: {restoreUrl?: boolean}): Promise<PresenterAsyncResult>;
}

export type PresenterMap = Record<string, PresenterDefinition>;
export type PresenterApis<P extends PresenterMap> = {[K in keyof P]: PresenterApi};

export interface LayergeControlledHookContext {
    entryId: string;
    action: string;
    signal: AbortSignal;
    fromFullPath?: string;
    toFullPath?: string;
}

export interface LayergeControlledHooks {
    beforeOpen?: (ctx: LayergeControlledHookContext) => boolean | void | Promise<boolean | void>;
    beforeClose?: (ctx: LayergeControlledHookContext) => boolean | void | Promise<boolean | void>;
    beforeNavigate?: (ctx: LayergeControlledHookContext) => boolean | void | Promise<boolean | void>;
}

export interface CreateLayergeRouterOptions<P extends PresenterMap = PresenterMap> {
    router: Router;
    presenters?: P;

    /** デバッグログを有効にします */
    debug?: boolean;

    /** 背景ルートの比較方法（v3.0） */
    backgroundCompare?: 'fullPath' | 'path';

    /** @deprecated v1.x互換: display を優先して利用してください */
    stack?: boolean;

    /** @deprecated v1.x互換: display を優先して利用してください */
    cache?: boolean;

    /** デフォルト表示モード（推奨）。指定した場合 stack/cache を上書きします。 */
    display?: PresenterDisplay;

    /**
     * Presenter の mount 既定値（v3.0）
     * - preMounted / keepMounted / mountPreset
     */
    presenterDefaults?: {
        preMounted?: boolean;
        keepMounted?: boolean;
        mountPreset?: 'default' | 'keep' | 'pre' | 'prekeep';
    };

    /** 制御型 hooks（v3.0 / opt-in） */
    controlledHooks?: LayergeControlledHooks;
}

export type LayergeRouter<P extends PresenterMap = PresenterMap> = Router &
    PresenterApis<P> & {
        $layerge: LayergeStore;
        exitPresenterMode: () => void;
        getLayergeState: () => {mode: 'page' | 'presenter'; depth: number};
    };

export declare function createLayergeRouter<P extends PresenterMap>(
    options: CreateLayergeRouterOptions<P>
): LayergeRouter<P>;

export declare const LayergeView: Component;

export declare const LayergeTransition: Component;

/**
 * RouterLink互換の最小Link導線（P1）
 */
export declare const LayergeLink: Component;

export declare function useLayerge(): {
    readonly mode: 'page' | 'presenter';
    readonly depth: number;
    closeTop: (options?: {restoreUrl?: boolean}) => void;
    closeAll: (options?: {restoreUrl?: boolean}) => void;
    exit: () => void;
};

export declare function usePresenter(): {
    readonly handle: PresenterHandle;
    readonly entry: PresenterEntry | null;
    readonly isTop: boolean;
};

/**
 * Presenter 配下の EntryContext をもとに、v-bind 用の bindings を生成します。
 */
export declare function usePresenterBindings<T extends Record<string, any>>(
    mapper: (ctx: LayergeEntryContext) => T
): ComputedRef<T>;

/**
 * Presenter の離脱ガードを登録します。
 * dirty / pending の保持と confirm UI は Presenter（アプリ）側の責務です。
 */
export declare function usePresenterLeaveGuard(opts?: {
    dirty?: Ref<boolean> | boolean;
    pending?: Ref<boolean> | boolean;
    commit?: () => Promise<void>;
    message?: string;
    confirm?: (ctx: {entryId: string; reason: string}) => boolean | Promise<boolean>;
}): {
    entryId: ComputedRef<string | null>;
    dirty: Ref<boolean> | boolean;
    pending: Ref<boolean> | boolean;
};

export type LayergeLinkAttrs = Record<string, unknown>;

export interface LayergeLinkHookResult {
    ok: boolean;
    stage: 'open' | 'close';
    entryId?: string | null;
    /** NavigationFailure など（open 失敗時） */
    failure?: unknown;
    error?: unknown;
}

export interface LayergeLinkHooks {
    beforeOpen?: () => void;
    opened?: (info: {entryId: string | null}) => void;
    entered?: (info: {entryId: string}) => void;
    openFailed?: (error: unknown) => void;
    beforeClose?: (info: {entryId: string}) => void;
    closed?: (info: {entryId: string | null}) => void;
    closeFailed?: (error: unknown) => void;
    settled?: (result: LayergeLinkHookResult) => void;
}

export interface UseLayergeLinkBindings extends LayergeLinkAttrs {
    ref: import('vue').Ref<HTMLElement | null>;
}

export interface UseLayergeLinkHandlers {
    open: (event?: unknown) => void;
    push: (event?: unknown) => void;
    replace: (event?: unknown) => void;
}

export declare function useLayergeLink(
    to: PresenterTarget,
    computeAttrs?: () => LayergeLinkAttrs,
    hooks?: LayergeLinkHooks | {hooks: LayergeLinkHooks}
): {bindings: UseLayergeLinkBindings; handler: UseLayergeLinkHandlers; handlers: UseLayergeLinkHandlers};
