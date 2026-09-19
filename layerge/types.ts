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
 * PresenterDisplay - Presenter の表示モード
 */
export type PresenterDisplay = 'top' | 'stack' | 'stack+cache';

/**
 * PresenterTarget - open/push/replace の第1引数
 */
export type PresenterTarget = RouteLocationRaw | Component | (() => Promise<Component>);

/**
 * PresenterOpenOptions - openの第2引数
 *
 * open は view-only のため、URL オプション（url）は受け付けません
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
    /** open/push/replace の確定結果を通知します（opt-in の非同期 API 用） */
    result: Promise<PresenterAsyncResult>;
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
    /** result を resolve します */
    _resolveResult: (value: PresenterAsyncResult) => void;
    /** closed を resolve します */
    _resolveClosed: () => void;
    /** isActive を更新します */
    _setActive: (v: boolean) => void;
    /** Presenter を閉じます（冪等） */
    close: () => void;
    /** 閉じ完了を通知します */
    closed: Promise<void>;
    /** open/push/replace の確定結果を通知します */
    result: Promise<PresenterAsyncResult>;
    /** 有効状態を返します */
    isActive: boolean;
}

/**
 * PresenterEntry - Presenter スタック要素
 */
export interface PresenterEntry {
    /** エントリID */
    id: string;
    /** フェーズ（enter / active / leave） */
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
    /**
     * ハンドル
     *
     * 実体は PresenterHandleInternal ですが、公開面には内部ハンドルを出しません
     * （移行仕様書 6-4 の決定）。内部メンバーを読む側でキャストします。
     */
    handle: PresenterHandle;
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
    /** url のため未マッチルートを許容するか */
    allowUnmatched: boolean;
    /** Component/loader target の場合の描画用コンポーネント */
    viewComponent: Component | null;
    /** ハンドル（実体は PresenterHandleInternal。公開面には出しません） */
    handle: PresenterHandle;
}

/**
 * PresenterDefinition - Presenter 登録定義
 */
export interface PresenterDefinition {
    /** Presenter の枠コンポーネント */
    component: Component;
    /** 表示モード */
    display?: PresenterDisplay;
    /**
     * display から導出した内部表現です（正規化後の presenters にのみ現れます）
     * @internal
     */
    stack?: boolean;
    /**
     * display から導出した内部表現です（正規化後の presenters にのみ現れます）
     * @internal
     */
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
    /**
     * afterEach commit待ち
     *
     * 内部型 PendingPresenterNav を参照するため公開面には出しません
     * （手書き index.d.ts も /** @internal *\/ pending: unknown としていました）。
     * @internal
     */
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
     * entryId と trigger DOM の対応表
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
     * Invokerを登録
     * @internal
     */
    _setInvoker?: (entryId: string, el: HTMLElement) => void;
    /**
     * Invokerを取得
     * @internal
     */
    _getInvoker?: (entryId: string) => LayergeInvoker | null;
    /**
     * Invokerを破棄
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
    /**
     * trigger DOM 捕捉用 ref
     *
     * `v-bind="bindings"` で展開すると、マウント後に対象要素が入ります
     * （ROADMAP A-14 で実測済み）。invoker をイベント無しで解決する際に使われます。
     */
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
 * LayergeInvoker - entryId と trigger DOM を結びつける最小構造
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
 * PresenterApi - Presenter 1 つ分の操作 API
 */
export interface PresenterApi {
    push(target: PresenterTarget, options?: PresenterPushReplaceOptions): PresenterHandle;
    /** opt-in の非同期 API（確定結果のみ返す） */
    pushAsync(target: PresenterTarget, options?: PresenterPushReplaceOptions): Promise<PresenterAsyncResult>;
    replace(target: PresenterTarget, options?: PresenterPushReplaceOptions): PresenterHandle;
    open(target: PresenterTarget, options?: PresenterOpenOptions): PresenterHandle;
    /** opt-in の非同期 API（close の確定結果のみ返す） */
    closeAsync(entryId: string, options?: {restoreUrl?: boolean}): Promise<PresenterAsyncResult>;
}

/**
 * PresenterMap - Presenter 名をキーとする定義マップ
 */
export type PresenterMap = Record<string, PresenterDefinition>;

/**
 * PresenterApis - Presenter 定義マップのキーごとに API を生やした形
 */
export type PresenterApis<P extends PresenterMap> = {[K in keyof P]: PresenterApi};

/**
 * LayergeRouter - createLayergeRouter が返す、Presenter API を備えた Router
 */
export type LayergeRouter<P extends PresenterMap = PresenterMap> = Router &
    PresenterApis<P> & {
        $layerge: LayergeStore;
        exitPresenterMode: () => void;
        getLayergeState: () => {mode: 'page' | 'presenter'; depth: number};
    };

/**
 * CreateLayergeRouterOptions
 *
 * ジェネリック P は presenters のキーを保持し、LayergeRouter 側で
 * router.<presenterName> の型付けに使われます。**外すと利用者の
 * router.modal.push() が型エラーになります**（移行仕様書の差分台帳を参照）。
 */
export interface CreateLayergeRouterOptions<P extends PresenterMap = PresenterMap> {
    /** 対象の Vue Router */
    router: Router;
    /** Presenter 定義マップ */
    presenters?: P;
    /** デバッグログを有効にします（既定: false） */
    debug?: boolean;
    /** 背景ルートの比較方法（既定: 'fullPath'） */
    backgroundCompare?: 'fullPath' | 'path';
    /** 既定の表示モード（presenter 側で display を指定しない場合に使います） */
    display?: PresenterDisplay;
    /** Presenter の mount 既定値 */
    presenterDefaults?: {
        preMounted?: boolean;
        keepMounted?: boolean;
        mountPreset?: 'default' | 'keep' | 'pre' | 'prekeep';
    };
    /** 制御型 hooks（opt-in） */
    controlledHooks?: LayergeControlledHooks;
}
