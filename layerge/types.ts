import type {Component, Ref} from 'vue';
import type {RouteLocationNormalizedLoaded, RouteLocationRaw, Router} from 'vue-router';

/**
 * LayergeMode - 画面モード
 */
export type LayergeMode = 'page' | 'presenter';

/**
 * PresenterKind - Presenter の遷移種別
 */
export type PresenterKind = 'push' | 'replace' | 'open';

/**
 * PresenterDisplay - Presenter の表示モード（v1.x）
 */
export type PresenterDisplay = 'top' | 'stack' | 'stack+cache';

/**
 * PresenterTarget - open/push/replace の第1引数
 */
export type PresenterTarget = RouteLocationRaw | Component | (() => Promise<Component>);

/**
 * PresenterOpenOptions - openの第2引数
 *
 * v3.0: openはview-onlyのため、URLオプション（fakePath/url）は受け付けません
 */
export interface PresenterOpenOptions {
    /** true の場合、表示前にDOMが存在してよい（最小のhidden制御のみ） */
    preMounted?: boolean;
    /** true の場合、close時にアンマウントせず非表示のみを行います */
    keepMounted?: boolean;
    /** mount設定プリセット（preMounted/keepMountedを上書き） */
    mountPreset?: 'default' | 'keep' | 'pre' | 'prekeep';
}

/**
 * PresenterPushReplaceOptions - push/replaceの第2引数
 */
export interface PresenterPushReplaceOptions {
    /** push/replace のみ：URL を指定します（Presenter は Component/loader でも OK） */
    url?: string | RouteLocationRaw | undefined;
    /** @deprecated v3.0: url へ移行しました（互換のために残しています） */
    fakePath?: string | undefined;
    /** true の場合、表示前にDOMが存在してよい（最小のhidden制御のみ） */
    preMounted?: boolean | undefined;
    /** true の場合、close時にアンマウントせず非表示のみを行います */
    keepMounted?: boolean | undefined;
    /** mount設定プリセット（preMounted/keepMountedを上書き） */
    mountPreset?: 'default' | 'keep' | 'pre' | 'prekeep' | undefined;
}

/**
 * PresenterHandle - Presenter 操作用ハンドル
 */
export interface PresenterHandle {
    /** Presenter を閉じます（冪等） */
    close: () => void;
    /** 閉じ完了を通知します */
    closed: Promise<void>;
    /** open/push/replace の確定結果を通知します（v3.2 opt-in async 用） */
    settled: Promise<PresenterAsyncResult>;
    /** 有効状態を返します */
    isActive: boolean;
}

/**
 * PresenterAsyncResult - 操作の確定結果（例外を投げない）
 */
export interface PresenterAsyncResult {
    /** 状態 */
    status: 'completed' | 'aborted' | 'failed' | 'superseded';
}

/**
 * PresenterHandleInternal - 内部用ハンドル
 */
export interface PresenterHandleInternal {
    /** 内部ID */
    _id: string;
    /** settled を resolve します */
    _resolveSettled: (value: PresenterAsyncResult) => void;
    /** closed を resolve します */
    _resolveClosed: () => void;
    /** isActive を更新します */
    _setActive: (v: boolean) => void;
    /** Presenter を閉じます（冪等） */
    close: () => void;
    /** 閉じ完了を通知します */
    closed: Promise<void>;
    /** open/push/replace の確定結果を通知します */
    settled: Promise<PresenterAsyncResult>;
    /** 有効状態を返します */
    isActive: boolean;
}

/**
 * PresenterEntry - Presenter スタック要素
 */
export interface PresenterEntry {
    /** エントリID */
    id: string;
    /** フェーズ（v1.x: enter/active/leave） */
    phase?: LayergeEntryPhase;
    /**
     * leave 遷移時点の index
     * @internal
     */
    _leavingIndex?: number | undefined;
    /**
     * leave 遷移時点の depth
     * @internal
     */
    _leavingDepth?: number | undefined;
    /**
     * keepMounted/preMounted 用の安定キー
     * @internal
     */
    _mountKey?: string | undefined;
    /**
     * preMounted 展開結果
     * @internal
     */
    _preMounted?: boolean | undefined;
    /**
     * keepMounted 展開結果
     * @internal
     */
    _keepMounted?: boolean | undefined;
    /**
     * hidden 表示制御
     * @internal
     */
    _isHidden?: boolean | undefined;
    /**
     * keepMounted の再利用キー
     * @internal
     */
    _keepKey?: string | undefined;
    /** 登録名 */
    presenterName: string;
    /** 種別 */
    kind: PresenterKind;
    /** close 時に適用するナビ種別（URL を動かした場合のみ push/replace） */
    navType: PresenterKind;
    /** replace-close の戻り先（from.fullPath）。不要な場合は null。 */
    returnTo: string | null;
    /** 対象ルート */
    route: RouteLocationNormalizedLoaded;
    /** Component/loader target の場合の描画用コンポーネント（RouteLocationRaw の場合は null） */
    viewComponent?: Component | null;
    /** ハンドル */
    handle: PresenterHandleInternal;
}

/**
 * PendingPresenterNav - afterEach 確定待ちの遷移情報
 */
export interface PendingPresenterNav {
    /** 予約ID */
    id: string;
    /** 内部トークン（最新操作が勝つ） */
    token: number;
    /** 登録名 */
    presenterName: string;
    /** 種別 */
    kind: 'push' | 'replace';
    /** close 時に適用するナビ種別 */
    navType: PresenterKind;
    /** replace-close の戻り先 */
    returnTo: string | null;
    /** 検証用に解決したルート */
    route: RouteLocationNormalizedLoaded;
    /** url(fakePath互換) のため未マッチルートを許容するか */
    allowUnmatched: boolean;
    /** Component/loader target の場合の描画用コンポーネント */
    viewComponent: Component | null;
    /** ハンドル */
    handle: PresenterHandleInternal;
}

/**
 * PresenterDefinition - Presenter 登録定義
 */
export interface PresenterDefinition {
    /** Presenter の枠コンポーネント */
    component: Component;
    /** 表示モード（推奨）。指定した場合 stack/cache を上書きします。 */
    display?: PresenterDisplay;
    /** このPresenterをstack扱いにする（互換） */
    stack?: boolean;
    /** このPresenterをfreeze表示する（stack前提・互換） */
    cache?: boolean;
}

/**
 * LayergeCloseOptions - Presenter終了時のオプション
 */
export interface LayergeCloseOptions {
    /** URL復元を行うかどうか（既定: true） */
    restoreUrl?: boolean;
}

/**
 * LayergeStore - Layergeの内部状態
 */
export interface LayergeStore {
    /** 現在モード */
    mode: LayergeMode;
    /** Presenterスタック */
    stack: PresenterEntry[];
    /** leave中の保持エントリ（必ず描画対象に含める） */
    leaving: PresenterEntry[];
    /** 背景ルート */
    backgroundRoute: RouteLocationNormalizedLoaded | null;
    /** afterEach commit待ち */
    pending: PendingPresenterNav | null;
    /**
     * 内部用フラグ
     * @internal
     */
    internalNav: boolean;
    /** Presenter定義 */
    presenters: {[key: string]: PresenterDefinition};
    /** 背景freeze */
    freezeBackground: boolean;
    /** デフォルトstack */
    stackEnabled: boolean;
    /** デフォルトcache */
    cacheEnabled: boolean;
    /**
     * LayergeTransitionで管理されているエントリIDのセット
     * @internal
     */
    _transitionManagedEntryIds?: Set<string>;
    /**
     * entryId と trigger DOM の対応表（v2）
     * @internal
     */
    _invokers?: Map<string, LayergeInvoker>;
    /**
     * keepMounted のための保持エントリ（v3）
     * @internal
     */
    _kept?: PresenterEntry[];
    /**
     * 強制終了
     * @internal
     */
    _exitPresenterMode?: () => void;
    /**
     * 一番上を閉じる
     * @internal
     */
    _closeTop?: (options?: LayergeCloseOptions) => void;
    /**
     * 全て閉じる
     * @internal
     */
    _closeAll?: (options?: LayergeCloseOptions) => void;
    /**
     * IDを指定して閉じる
     * @internal
     */
    _closeById?: (id: string, options?: LayergeCloseOptions) => void;
    /**
     * enter完了通知
     * @internal
     */
    _notifyEnterDone?: (entryId: string) => void;
    /**
     * leave完了通知
     * @internal
     */
    _notifyLeaveDone?: (entryId: string) => void;
    /**
     * Invokerを登録（v2）
     * @internal
     */
    _setInvoker?: (entryId: string, el: HTMLElement) => void;
    /**
     * Invokerを取得（v2）
     * @internal
     */
    _getInvoker?: (entryId: string) => LayergeInvoker | null;
    /**
     * Invokerを破棄（v2）
     * @internal
     */
    _deleteInvoker?: (entryId: string) => void;
}

/**
 * LayergeLinkAttrs - useLayergeLink / LayergeLink で使用する attrs
 */
export interface LayergeLinkAttrs {
    /** 任意の属性 */
    [key: string]: unknown;
}

/**
 * LayergeLinkHookResult - hooks.settled に渡す結果
 */
export interface LayergeLinkHookResult {
    /** 成功/失敗 */
    ok: boolean;
    /** 収束ステージ */
    stage: 'open' | 'close';
    /** entryId（取得できた場合） */
    entryId?: string | null | undefined;
    /** NavigationFailure など（open 失敗時） */
    failure?: unknown;
    /** エラー（例外など） */
    error?: unknown;
}

/**
 * LayergeLinkHooks - useLayergeLink の通知型 hooks
 */
export interface LayergeLinkHooks {
    /** open 前通知 */
    beforeOpen?: (() => void) | undefined;
    /** open → nextTick 後通知 */
    opened?: ((info: {entryId: string | null}) => void) | undefined;
    /** phase=active 到達通知 */
    entered?: ((info: {entryId: string}) => void) | undefined;
    /** open 失敗通知 */
    openFailed?: ((error: unknown) => void) | undefined;
    /** phase=leave 到達通知 */
    beforeClose?: ((info: {entryId: string}) => void) | undefined;
    /** close 完了通知 */
    closed?: ((info: {entryId: string | null}) => void) | undefined;
    /** close 失敗通知 */
    closeFailed?: ((error: unknown) => void) | undefined;
    /** 成功/失敗の収束通知 */
    settled?: ((result: LayergeLinkHookResult) => void) | undefined;
}

/**
 * UseLayergeLinkBindings - DOM にバインドする props
 */
export interface UseLayergeLinkBindings {
    /** trigger DOM 捕捉用 ref */
    ref: Ref<HTMLElement | null>;
    /** 任意の属性（computeAttrs の結果など） */
    [key: string]: unknown;
}

/**
 * UseLayergeLinkHandlers - 明示的な操作用ハンドラ
 */
export interface UseLayergeLinkHandlers {
    /** open（URL非変更） */
    open: (event?: unknown) => void;
    /** push */
    push: (event?: unknown) => void;
    /** replace */
    replace: (event?: unknown) => void;
}

/**
 * UseLayergeLinkResult - useLayergeLink の戻り値
 */
export interface UseLayergeLinkResult {
    /** v-bind 用の bindings（getterで返却される想定） */
    bindings: UseLayergeLinkBindings;
    /** handler（推奨） */
    handler: UseLayergeLinkHandlers;
    /** handlers（互換） */
    handlers: UseLayergeLinkHandlers;
}

/**
 * LayergeInvoker - entryId と trigger DOM を結びつける最小構造（v2）
 */
export interface LayergeInvoker {
    /** エントリID */
    entryId: string;
    /** 起点DOM */
    el: HTMLElement;
}

/**
 * LayergeStateSnapshot - 外部公開用の最小スナップショット
 */
export interface LayergeStateSnapshot {
    /** モード */
    mode: LayergeMode;
    /** スタック深さ */
    depth: number;
}

/**
 * LayergeEntryPhase - エントリのフェーズ
 */
export type LayergeEntryPhase = 'enter' | 'active' | 'leave';

/**
 * LayergeEntryContext - Presenter 配下で公開する最小ステート（EntryContext）
 */
export interface LayergeEntryContext {
    /** エントリID */
    entryId: string;
    /** フェーズ */
    phase: LayergeEntryPhase;
    /** 表示順（0始まり） */
    index: number;
    /** スタック深さ */
    depth: number;
    /** 最上段か */
    isTop: boolean;
}

/**
 * BackgroundCompareMode
 */
export type BackgroundCompareMode = 'fullPath' | 'path';

/**
 * LayergeControlledHookContext
 */
export interface LayergeControlledHookContext {
    /** 操作対象 entryId（open/push/replace の試行単位） */
    entryId: string;
    /** 操作種別（open/push/replace/close など） */
    action: string;
    /** latest-wins による superseded 通知 */
    signal: AbortSignal;
    /** beforeNavigate 用（現在URL） */
    fromFullPath?: string | undefined;
    /** beforeNavigate 用（遷移先URL） */
    toFullPath?: string | undefined;
}

/**
 * LayergeControlledHooks
 */
export interface LayergeControlledHooks {
    /** open/push/replace の開始前（falseで中止） */
    beforeOpen?: (ctx: LayergeControlledHookContext) => boolean | void | Promise<boolean | void>;
    /** close 前（falseで中止） */
    beforeClose?: (ctx: LayergeControlledHookContext) => boolean | void | Promise<boolean | void>;
    /** push/replace の router ナビ前（falseで中止） */
    beforeNavigate?: (ctx: LayergeControlledHookContext) => boolean | void | Promise<boolean | void>;
}

/**
 * CreateLayergeRouterOptions
 */
export interface CreateLayergeRouterOptions {
    /** 対象の Vue Router */
    router: Router;
    /** デバッグログを有効にします（既定: false） */
    debug?: boolean;
    /** Presenter 定義マップ */
    presenters?: {[key: string]: PresenterDefinition};
    /** 背景ルートの比較方法（既定: 'fullPath'） */
    backgroundCompare?: 'fullPath' | 'path';
    /** デフォルトstack（既定: false） */
    stack?: boolean;
    /** デフォルトcache（既定: false） */
    cache?: boolean;
    /** デフォルト表示モード（推奨）。指定した場合 stack/cache を上書きします。 */
    display?: PresenterDisplay;
    /** Presenter の mount 既定値（v3.0） */
    presenterDefaults?: {
        preMounted?: boolean;
        keepMounted?: boolean;
        mountPreset?: 'default' | 'keep' | 'pre' | 'prekeep';
    };
    /** 制御型 hooks（v3.0 / opt-in） */
    controlledHooks?: LayergeControlledHooks;
}
