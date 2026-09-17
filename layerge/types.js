/**
 * LayergeMode - 画面モード
 * @typedef {'page'|'presenter'} LayergeMode
 */

/**
 * PresenterKind - Presenter の遷移種別
 * @typedef {'push'|'replace'|'open'} PresenterKind
 */

/**
 * PresenterDisplay - Presenter の表示モード（v1.x）
 * @typedef {'top'|'stack'|'stack+cache'} PresenterDisplay
 */

/**
 * PresenterTarget - open/push/replace の第1引数
 * @typedef {import('vue-router').RouteLocationRaw|import('vue').Component|(() => Promise<import('vue').Component>)} PresenterTarget
 */

/**
 * PresenterOpenOptions - openの第2引数
 * @typedef {object} PresenterOpenOptions
 * @description v3.0: openはview-onlyのため、URLオプション（fakePath/url）は受け付けません
 * @property {boolean} [preMounted] - true の場合、表示前にDOMが存在してよい（最小のhidden制御のみ）
 * @property {boolean} [keepMounted] - true の場合、close時にアンマウントせず非表示のみを行います
 * @property {'default'|'keep'|'pre'|'prekeep'} [mountPreset] - mount設定プリセット（preMounted/keepMountedを上書き）
 */

/**
 * PresenterPushReplaceOptions - push/replaceの第2引数
 * @typedef {object} PresenterPushReplaceOptions
 * @property {string|import('vue-router').RouteLocationRaw|undefined} [url] - push/replace のみ：URL を指定します（Presenter は Component/loader でも OK）
 * @property {string|undefined} [fakePath] - @deprecated v3.0: url へ移行しました（互換のために残しています）
 * @property {boolean|undefined} [preMounted] - true の場合、表示前にDOMが存在してよい（最小のhidden制御のみ）
 * @property {boolean|undefined} [keepMounted] - true の場合、close時にアンマウントせず非表示のみを行います
 * @property {'default'|'keep'|'pre'|'prekeep'|undefined} [mountPreset] - mount設定プリセット（preMounted/keepMountedを上書き）
 */

/**
 * PresenterHandle - Presenter 操作用ハンドル
 * @typedef {object} PresenterHandle
 * @property {() => void} close - Presenter を閉じます（冪等）
 * @property {Promise<void>} closed - 閉じ完了を通知します
 * @property {Promise<PresenterAsyncResult>} settled - open/push/replace の確定結果を通知します（v3.2 opt-in async 用）
 * @property {boolean} isActive - 有効状態を返します
 */

/**
 * PresenterAsyncResult - 操作の確定結果（例外を投げない）
 * @typedef {object} PresenterAsyncResult
 * @property {'completed'|'aborted'|'failed'|'superseded'} status - 状態
 */

/**
 * PresenterHandleInternal - 内部用ハンドル
 * @typedef {object} PresenterHandleInternal
 * @property {string} _id - 内部ID
 * @property {(value: PresenterAsyncResult) => void} _resolveSettled - settled を resolve します
 * @property {() => void} _resolveClosed - closed を resolve します
 * @property {(v:boolean) => void} _setActive - isActive を更新します
 * @property {() => void} close - Presenter を閉じます（冪等）
 * @property {Promise<void>} closed - 閉じ完了を通知します
 * @property {Promise<PresenterAsyncResult>} settled - open/push/replace の確定結果を通知します
 * @property {boolean} isActive - 有効状態を返します
 */

/**
 * PresenterEntry - Presenter スタック要素
 * @typedef {object} PresenterEntry
 * @property {string} id - エントリID
 * @property {LayergeEntryPhase} [phase] - フェーズ（v1.x: enter/active/leave）
 * @property {number|undefined} [_leavingIndex] - leave 遷移時点の index（内部）
 * @property {number|undefined} [_leavingDepth] - leave 遷移時点の depth（内部）
 * @property {string|undefined} [_mountKey] - keepMounted/preMounted 用の安定キー（内部）
 * @property {boolean|undefined} [_preMounted] - preMounted 展開結果（内部）
 * @property {boolean|undefined} [_keepMounted] - keepMounted 展開結果（内部）
 * @property {boolean|undefined} [_isHidden] - hidden 表示制御（内部）
 * @property {string|undefined} [_keepKey] - keepMounted の再利用キー（内部）
 * @property {string} presenterName - 登録名
 * @property {PresenterKind} kind - 種別
 * @property {PresenterKind} navType - close 時に適用するナビ種別（URL を動かした場合のみ push/replace）
 * @property {string|null} returnTo - replace-close の戻り先（from.fullPath）。不要な場合は null。
 * @property {import('vue-router').RouteLocationNormalizedLoaded} route - 対象ルート
 * @property {import('vue').Component|null} [viewComponent] - Component/loader target の場合の描画用コンポーネント（RouteLocationRaw の場合は null）
 * @property {PresenterHandleInternal} handle - ハンドル
 */

/**
 * PendingPresenterNav - afterEach 確定待ちの遷移情報
 * @typedef {object} PendingPresenterNav
 * @property {string} id - 予約ID
 * @property {number} token - 内部トークン（最新操作が勝つ）
 * @property {string} presenterName - 登録名
 * @property {'push'|'replace'} kind - 種別
 * @property {PresenterKind} navType - close 時に適用するナビ種別
 * @property {string|null} returnTo - replace-close の戻り先
 * @property {import('vue-router').RouteLocationNormalizedLoaded} route - 検証用に解決したルート
 * @property {boolean} allowUnmatched - url(fakePath互換) のため未マッチルートを許容するか
 * @property {import('vue').Component|null} viewComponent - Component/loader target の場合の描画用コンポーネント
 * @property {PresenterHandleInternal} handle - ハンドル
 */

/**
 * PresenterDefinition - Presenter 登録定義
 * @typedef {object} PresenterDefinition
 * @property {import('vue').Component} component - Presenter の枠コンポーネント
 * @property {PresenterDisplay} [display] - 表示モード（推奨）。指定した場合 stack/cache を上書きします。
 * @property {boolean} [stack] - このPresenterをstack扱いにする（互換）
 * @property {boolean} [cache] - このPresenterをfreeze表示する（stack前提・互換）
 */

/**
 * LayergeCloseOptions - Presenter終了時のオプション
 * @typedef {object} LayergeCloseOptions
 * @property {boolean} [restoreUrl=true] - URL復元を行うかどうか
 */

/**
 * LayergeStore - Layergeの内部状態
 * @typedef {object} LayergeStore
 * @property {LayergeMode} mode - 現在モード
 * @property {PresenterEntry[]} stack - Presenterスタック
 * @property {PresenterEntry[]} leaving - leave中の保持エントリ（必ず描画対象に含める）
 * @property {import('vue-router').RouteLocationNormalizedLoaded|null} backgroundRoute - 背景ルート
 * @property {PendingPresenterNav|null} pending - afterEach commit待ち
 * @property {boolean} internalNav - 内部用フラグ
 * @property {{[key: string]: PresenterDefinition}} presenters - Presenter定義
 * @property {boolean} freezeBackground - 背景freeze
 * @property {boolean} stackEnabled - デフォルトstack
 * @property {boolean} cacheEnabled - デフォルトcache
 * @property {Set<string>} [_transitionManagedEntryIds] - LayergeTransitionで管理されているエントリIDのセット（内部）
 * @property {Map<string, LayergeInvoker>} [_invokers] - entryId と trigger DOM の対応表（内部・v2）
 * @property {PresenterEntry[]} [_keptEntries] - keepMounted のための保持エントリ（内部・v3）
 * @property {(() => void)} [_exitPresenterMode] - 強制終了（内部）
 * @property {((options?: LayergeCloseOptions) => void)} [_closeTop] - 一番上を閉じる（内部）
 * @property {((options?: LayergeCloseOptions) => void)} [_closeAll] - 全て閉じる（内部）
 * @property {((id: string, options?: LayergeCloseOptions) => void)} [_closeById] - IDを指定して閉じる（内部）
 * @property {((entryId: string) => void)} [_notifyEnterDone] - enter完了通知（内部）
 * @property {((entryId: string) => void)} [_notifyLeaveDone] - leave完了通知（内部）
 * @property {((entryId: string, el: HTMLElement) => void)} [_setInvoker] - Invokerを登録（内部・v2）
 * @property {((entryId: string) => LayergeInvoker|null)} [_getInvoker] - Invokerを取得（内部・v2）
 * @property {((entryId: string) => void)} [_deleteInvoker] - Invokerを破棄（内部・v2）
 */

/**
 * LayergeLinkAttrs - useLayergeLink / LayergeLink で使用する attrs
 * @typedef {object} LayergeLinkAttrs
 * @property {unknown} [key] - 任意の属性
 */

/**
 * LayergeLinkHookResult - hooks.settled に渡す結果
 * @typedef {object} LayergeLinkHookResult
 * @property {boolean} ok - 成功/失敗
 * @property {'open'|'close'} stage - 収束ステージ
 * @property {string|null|undefined} [entryId] - entryId（取得できた場合）
 * @property {unknown|undefined} [failure] - NavigationFailure など（open 失敗時）
 * @property {unknown|undefined} [error] - エラー（例外など）
 */

/**
 * LayergeLinkHooks - useLayergeLink の通知型 hooks
 * @typedef {object} LayergeLinkHooks
 * @property {(() => void)|undefined} [beforeOpen] - open 前通知
 * @property {((info:{entryId:string|null}) => void)|undefined} [opened] - open → nextTick 後通知
 * @property {((info:{entryId:string}) => void)|undefined} [entered] - phase=active 到達通知
 * @property {((error:unknown) => void)|undefined} [openFailed] - open 失敗通知
 * @property {((info:{entryId:string}) => void)|undefined} [beforeClose] - phase=leave 到達通知
 * @property {((info:{entryId:string|null}) => void)|undefined} [closed] - close 完了通知
 * @property {((error:unknown) => void)|undefined} [closeFailed] - close 失敗通知
 * @property {((result:LayergeLinkHookResult) => void)|undefined} [settled] - 成功/失敗の収束通知
 */

/**
 * UseLayergeLinkBindings - DOM にバインドする props
 * @typedef {object} UseLayergeLinkBindings
 * @property {import('vue').Ref<HTMLElement|null>} ref - trigger DOM 捕捉用 ref
 * @property {unknown} [key] - 任意の属性（computeAttrs の結果など）
 */

/**
 * UseLayergeLinkHandlers - 明示的な操作用ハンドラ
 * @typedef {object} UseLayergeLinkHandlers
 * @property {(event?:unknown) => void} open - open（URL非変更）
 * @property {(event?:unknown) => void} push - push
 * @property {(event?:unknown) => void} replace - replace
 */

/**
 * UseLayergeLinkResult - useLayergeLink の戻り値
 * @typedef {object} UseLayergeLinkResult
 * @property {UseLayergeLinkBindings} bindings - v-bind 用の bindings（getterで返却される想定）
 * @property {UseLayergeLinkHandlers} handler - handler（推奨）
 * @property {UseLayergeLinkHandlers} handlers - handlers（互換）
 */

/**
 * LayergeInvoker - entryId と trigger DOM を結びつける最小構造（v2）
 * @typedef {object} LayergeInvoker
 * @property {string} entryId - エントリID
 * @property {HTMLElement} el - 起点DOM
 */

/**
 * LayergeStateSnapshot - 外部公開用の最小スナップショット
 * @typedef {object} LayergeStateSnapshot
 * @property {LayergeMode} mode - モード
 * @property {number} depth - スタック深さ
 */

/**
 * LayergeEntryPhase - エントリのフェーズ
 * @typedef {'enter'|'active'|'leave'} LayergeEntryPhase
 */

/**
 * LayergeEntryContext - Presenter 配下で公開する最小ステート（EntryContext）
 * @typedef {object} LayergeEntryContext
 * @property {string} entryId - エントリID
 * @property {LayergeEntryPhase} phase - フェーズ
 * @property {number} index - 表示順（0始まり）
 * @property {number} depth - スタック深さ
 * @property {boolean} isTop - 最上段か
 */

/**
 * BackgroundCompareMode
 * @typedef {'fullPath'|'path'} BackgroundCompareMode
 */

/**
 * LayergeControlledHookContext
 * @typedef {object} LayergeControlledHookContext
 * @property {string} entryId - 操作対象 entryId（open/push/replace の試行単位）
 * @property {string} action - 操作種別（open/push/replace/close など）
 * @property {AbortSignal} signal - latest-wins による superseded 通知
 * @property {string|undefined} [fromFullPath] - beforeNavigate 用（現在URL）
 * @property {string|undefined} [toFullPath] - beforeNavigate 用（遷移先URL）
 */

/**
 * LayergeControlledHooks
 * @typedef {object} LayergeControlledHooks
 * @property {(ctx:LayergeControlledHookContext) => (boolean|void|Promise<boolean|void>)} [beforeOpen] - open/push/replace の開始前（falseで中止）
 * @property {(ctx:LayergeControlledHookContext) => (boolean|void|Promise<boolean|void>)} [beforeClose] - close 前（falseで中止）
 * @property {(ctx:LayergeControlledHookContext) => (boolean|void|Promise<boolean|void>)} [beforeNavigate] - push/replace の router ナビ前（falseで中止）
 */

/**
 * CreateLayergeRouterOptions
 * @typedef {object} CreateLayergeRouterOptions
 * @property {import('vue-router').Router} router - 対象の Vue Router
 * @property {boolean} [debug=false] - デバッグログを有効にします
 * @property {{[key: string]: PresenterDefinition}} [presenters] - Presenter 定義マップ
 * @property {'fullPath'|'path'} [backgroundCompare='fullPath'] - 背景ルートの比較方法
 * @property {boolean} [stack=false] - デフォルトstack
 * @property {boolean} [cache=false] - デフォルトcache
 * @property {PresenterDisplay} [display] - デフォルト表示モード（推奨）。指定した場合 stack/cache を上書きします。
 * @property {{preMounted?:boolean, keepMounted?:boolean, mountPreset?:'default'|'keep'|'pre'|'prekeep'}} [presenterDefaults] - Presenter の mount 既定値（v3.0）
 * @property {LayergeControlledHooks} [controlledHooks] - 制御型 hooks（v3.0 / opt-in）
 */
