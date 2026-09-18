import {defineAsyncComponent, markRaw, nextTick} from 'vue';
import {
    __layergeHasPresenterLeaveGuard,
    __layergeRunPresenterLeaveGuard,
    __layergeSubscribeBeforeUnload
} from '../composables/usePresenterLeaveGuard.js';
import {createLayergeStore} from '../core/store';
import {createPresenterHandle} from '../core/handle';
import {createId} from '../core/id';
import {createInternalOutcome, projectOutcomeToPublic} from '../internals/outcome.js';
import type {LayergeOutcomePublic, OutcomeInternalStatus, OutcomeStage} from '../internals/outcome.js';
import {createDecisionTraceStore, MAX_TRACES_DEFAULT} from '../internals/decisionTrace.js';
import type {DecisionTrace} from '../internals/decisionTrace.js';
import {LayergeKey} from '../internals/keys';
import LayergeView from '../view/LayergeView.vue';
import LayergeTransition from '../view/LayergeTransition.vue';
import type {Component} from 'vue';
import type {RouteLocationNormalizedLoaded} from 'vue-router';
import type {
    CreateLayergeRouterOptions,
    LayergeControlledHookContext,
    LayergeRouter,
    PendingPresenterNav,
    PresenterApi,
    PresenterDefinition,
    PresenterHandleInternal,
    PresenterKind,
    PresenterMap,
    PresenterPushReplaceOptions
} from '../types';

/**
 * installedApps - インストール済みのVueアプリケーションを追跡するWeakSet
 * @constant
 * @type {WeakSet<object>}
 */
/**
 * ProcessLike - NODE_ENV / LAYERGE_DECISION_TRACE_LEVEL の読み取りに必要な最小形
 *
 * ライブラリは Node の型定義に依存しないため、globalThis からの取り出しに用います。
 */
interface ProcessLike {
    env?: Record<string, string | undefined>;
}

/**
 * GlobalLike - globalThis 経由で参照するホスト側の値
 */
interface GlobalLike {
    process?: ProcessLike;
    __LAYERGE_DECISION_TRACE_LEVEL?: unknown;
}

/**
 * DecisionTraceGlobals - dev-only のデバッグ導線（globalThis に生やす）
 */
interface DecisionTraceGlobals {
    __layergeGetDecisionTraces?: () => DecisionTrace[];
    __layergeDumpDecisionTraces?: (options?: {pretty?: boolean; max?: number}) => string;
}

/**
 * ImportMetaLike - import.meta.env（バンドラが注入する）を読むための形
 */
interface ImportMetaLike {
    env?: Record<string, string | undefined>;
}

/**
 * PendingWithTrace - pending に dev-only の trace 情報を加えた形
 *
 * PendingPresenterNav（types.ts）は traceId / traceSettled を宣言していませんが、
 * 実装は v4.0 の DecisionTrace 用に保持しています。公開型には出ないため、
 * ここでは実装ファイル内の交差型として扱います。
 */
type PendingWithTrace = PendingPresenterNav & {
    traceId?: string;
    traceSettled?: boolean;
};

/**
 * HandleWithNav - handle にナビゲーション完了 Promise を加えた形
 *
 * PresenterHandleInternal には現れない内部プロパティです。
 */
type HandleWithNav = PresenterHandleInternal & {
    _navPromise?: Promise<unknown>;
};

const installedApps = new WeakSet();

/**
 * isDevEnv - 開発環境かどうかを推定します
 * @returns 開発環境の場合true、本番環境の場合false
 */
const isDevEnv = (): boolean => {
    try {
        const process = typeof globalThis !== 'undefined' ? (globalThis as GlobalLike).process : undefined;

        if (process && process.env && typeof process.env.NODE_ENV === 'string') {
            return process.env.NODE_ENV !== 'production';
        }
    } catch {
        // ignore
    }

    try {
        if (
            typeof import.meta !== 'undefined' &&
            (import.meta as ImportMetaLike).env &&
            typeof (import.meta as ImportMetaLike).env.MODE === 'string'
        ) {
            return (import.meta as ImportMetaLike).env.MODE !== 'production';
        }
    } catch {
        // ignore
    }

    // 最後の砦（unknown は dev 扱い）
    return true;
};

/**
 * createLayergeRouter - Router を拡張して Layerge の API を追加します
 * @param options - オプション
 * @throws {Error} オプション不正やルート解決・Presenter定義の不整合が発生した場合にスローします
 * @returns {import('vue-router').Router&{
 *  $layerge:import('../core/store').LayergeStore,
 *  exitPresenterMode:() => void,
 *  getLayergeState:() => {mode:import('../types').LayergeMode, depth:number}
 * }} 拡張ルータ
 */
const createLayergeRouter = <P extends PresenterMap = PresenterMap>(
    options: CreateLayergeRouterOptions<P>
): LayergeRouter<P> => {
    const router = options.router;
    const debug = options.debug === true;
    const isDevelopmentMode = isDevEnv();

    /**
     * readDecisionTraceLevelInternal - dev-only: DecisionTrace レベルを読み取ります
     * - 既定は off
     * - グローバル変数または環境変数から読み取ります（公開APIではありません）
     * @returns level
     */
    const readDecisionTraceLevelInternal = (): 'off' | 'on-failure' | 'on-unexpected' | 'verbose' => {
        if (!isDevelopmentMode) {
            return 'off';
        }

        try {
            const g: GlobalLike = typeof globalThis !== 'undefined' ? (globalThis as GlobalLike) : {};
            const nodeProcess = g && g.process ? g.process : null;
            // NOTE: import.meta を一度変数に受ける。直接 import.meta.env.X と書くと
            // ライブラリのビルド時に静的置換され、利用者側の環境変数が読めなくなる。
            const meta = import.meta as ImportMetaLike;

            const raw =
                (g && typeof g.__LAYERGE_DECISION_TRACE_LEVEL === 'string'
                    ? g.__LAYERGE_DECISION_TRACE_LEVEL
                    : null) ||
                (nodeProcess &&
                nodeProcess.env &&
                typeof nodeProcess.env.LAYERGE_DECISION_TRACE_LEVEL === 'string'
                    ? nodeProcess.env.LAYERGE_DECISION_TRACE_LEVEL
                    : null) ||
                (typeof import.meta !== 'undefined' &&
                import.meta &&
                meta.env &&
                typeof meta.env.VITE_LAYERGE_DECISION_TRACE_LEVEL === 'string'
                    ? meta.env.VITE_LAYERGE_DECISION_TRACE_LEVEL
                    : null);

            if (raw === 'off' || raw === 'on-failure' || raw === 'on-unexpected' || raw === 'verbose') {
                return raw;
            }
        } catch {
            // ignore
        }

        return 'off';
    };

    /**
     * sanitizeDecisionTraceData - DecisionTrace に出す data をサニタイズします
     * - URL / query 等の機密値は出さない
     * - deep object は展開しない
     * @param data - data
     * @returns sanitized
     */
    const sanitizeDecisionTraceData = (data: object): object => {
        const blockedKeys = new Set([
            'url',
            'path',
            'fullPath',
            'toFullPath',
            'fromFullPath',
            'query',
            'params',
            'hash',
            'to',
            'from',
            'route',
            'navigateTo',
            'target'
        ]);

        /** @type {Record<string, unknown>} */
        const out: Record<string, unknown> = {};

        if (!data || typeof data !== 'object') {
            return out;
        }

        for (const [k, v] of Object.entries(data)) {
            if (blockedKeys.has(k)) {
                out[k] = '[redacted]';
                continue;
            }

            // also block by key pattern (defense-in-depth)
            if (typeof k === 'string' && /(url|path|query|hash|param|fullPath)/i.test(k)) {
                out[k] = '[redacted]';
                continue;
            }

            if (typeof v === 'string') {
                out[k] = v.length > 160 ? v.slice(0, 160) + '…' : v;
                continue;
            }

            if (typeof v === 'number' || typeof v === 'boolean' || v == null) {
                out[k] = v;
                continue;
            }

            // object/function は展開しない
            out[k] = '[omitted]';
        }

        return out;
    };

    /** @type {'off'|'on-failure'|'on-unexpected'|'verbose'} */
    const decisionTraceLevel = readDecisionTraceLevelInternal();

    const decisionTraceStore = createDecisionTraceStore({
        isDev: isDevelopmentMode,
        level: decisionTraceLevel,
        sanitize: sanitizeDecisionTraceData
    });

    /**
     * shouldEnableDecisionTraceGlobalsInternal - dev-only: globalThis へ dump/get を露出するか
     * - Public API ではありません
     * - dev + opt-in（debug または DecisionTraceLevel が on/off 以外）
     * @returns
     */
    const shouldEnableDecisionTraceGlobalsInternal = (): boolean => {
        if (!isDevelopmentMode) {
            return false;
        }

        if (debug) {
            return true;
        }

        return decisionTraceLevel !== 'off';
    };

    /**
     * installDecisionTraceGlobalsInternal
     * @returns
     */
    const installDecisionTraceGlobalsInternal = (): void => {
        const g = globalThis as typeof globalThis & DecisionTraceGlobals;
        const shouldEnable = shouldEnableDecisionTraceGlobalsInternal();

        if (!shouldEnable) {
            // dev-only であり、無効時は露出しない
            delete g.__layergeGetDecisionTraces;
            delete g.__layergeDumpDecisionTraces;
            return;
        }

        g.__layergeGetDecisionTraces = () => decisionTraceStore.getAll();

        g.__layergeDumpDecisionTraces = (options) => {
            const pretty = options && typeof options.pretty === 'boolean' ? options.pretty : true;
            const max =
                options && typeof options.max === 'number' && options.max > 0
                    ? options.max
                    : MAX_TRACES_DEFAULT;

            const traces = decisionTraceStore.getAll();
            const sliced = traces.length > max ? traces.slice(traces.length - max) : traces;

            return pretty ? JSON.stringify(sliced, null, 2) : JSON.stringify(sliced);
        };
    };

    // 複数 router がある場合は「最後に作られた router が上書き」で OK（dev-only / 互換保証外）
    installDecisionTraceGlobalsInternal();

    /**
     * shouldLogDecisionTraceInternal - 収束結果に応じて DecisionTrace を出すべきか
     * @param level - level
     * @param status - internal status
     * @returns should
     */
    const shouldLogDecisionTraceInternal = (
        level: 'off' | 'on-failure' | 'on-unexpected' | 'verbose',
        status: 'completed' | 'failed' | 'aborted' | 'superseded' | 'blocked'
    ): boolean => {
        if (!isDevelopmentMode) {
            return false;
        }

        if (level === 'off') {
            return false;
        }

        if (level === 'verbose') {
            return true;
        }

        if (level === 'on-failure') {
            return status === 'failed';
        }

        // on-unexpected
        return status !== 'completed';
    };

    /**
     * findTraceInternal - traceId に一致する trace を探します（リングバッファから）
     * @param traceId - traceId
     * @returns trace
     */
    const findTraceInternal = (
        traceId: string
    ): import('../internals/decisionTrace.js').DecisionTrace | null => {
        const traces = decisionTraceStore.getAll();
        for (let i = traces.length - 1; i >= 0; i--) {
            if (traces[i] && traces[i].traceId === traceId) {
                return traces[i];
            }
        }
        return null;
    };

    /**
     * logOutcomeInternal - Outcome Summary / DecisionTrace を出力します（dev-only）
     * @param internalOutcome - internal
     * @param [error] - error
     * @returns
     */
    const logOutcomeInternal = (
        internalOutcome: import('../internals/outcome.js').LayergeOutcomeInternal,
        error?: Error | unknown
    ): void => {
        if (!shouldLogDecisionTraceInternal(decisionTraceLevel, internalOutcome.status)) {
            return;
        }

        const summary = {
            traceId: internalOutcome.traceId,
            stage: internalOutcome.stage,
            status: internalOutcome.status,
            reason: internalOutcome.reason
        };

        // 1) Outcome summary
        if (internalOutcome.status === 'failed') {
            console.warn('[Layerge][outcome]', summary);
        } else if (internalOutcome.status !== 'completed') {
            console.info('[Layerge][outcome]', summary);
        } else {
            console.debug('[Layerge][outcome]', summary);
        }

        // 2) DecisionTrace
        const trace = findTraceInternal(internalOutcome.traceId);
        if (trace) {
            // events はサニタイズ済み
            console.debug('[Layerge][trace]', {
                traceId: trace.traceId,
                events: trace.events.map((e) => ({type: e.type, data: e.data}))
            });
        }

        // 3) Error stack trace
        if (internalOutcome.status === 'failed' && error) {
            console.error('[Layerge][error]', {traceId: internalOutcome.traceId, error: error});
        }
    };

    /**
     * shouldLogOutcomeOneLineInternal
     * - dev では常に出す
     * - prod では debug オプション時のみ出す
     * @returns
     */
    const shouldLogOutcomeOneLineInternal = (): boolean => {
        if (isDevelopmentMode) {
            return true;
        }

        return debug;
    };

    /**
     * logOutcomeOneLineInternal - grep 向けの固定 1 行 outcome を出力します
     * @param internalOutcome - internal
     * @param publicOutcome - public
     * @returns
     */
    const logOutcomeOneLineInternal = (
        internalOutcome: import('../internals/outcome.js').LayergeOutcomeInternal,
        publicOutcome: import('../internals/outcome.js').LayergeOutcomePublic
    ): void => {
        if (!shouldLogOutcomeOneLineInternal()) {
            return;
        }

        const reason = internalOutcome.reason ? internalOutcome.reason : '-';

        const line =
            '[layerge] outcome ' +
            'traceId=' +
            internalOutcome.traceId +
            ' stage=' +
            internalOutcome.stage +
            ' status=' +
            internalOutcome.status +
            ' public=' +
            publicOutcome.status +
            ' reason=' +
            reason;

        if (internalOutcome.status === 'failed') {
            console.warn(line);
            return;
        }

        console.info(line);
    };

    /**
     * logFailedHintInternal - failed 時に dump 導線を短く案内します
     * @param traceId - traceId
     * @returns
     */
    const logFailedHintInternal = (traceId: string): void => {
        if (!isDevelopmentMode) {
            return;
        }

        const g = globalThis as typeof globalThis & DecisionTraceGlobals;
        if (typeof g.__layergeDumpDecisionTraces !== 'function') {
            return;
        }

        console.info('[layerge] hint traceId=' + traceId + ' dump=__layergeDumpDecisionTraces()');
    };

    /**
     * settleOutcomeInternal - 内部Outcomeの生成・射影・DecisionTrace確定・ログ出力をまとめます
     * @param args - args
     * @param args.traceId - 操作単位の traceId
     * @param args.stage - 操作種別
     * @param args.status - 収束ステータス（内部）
     * @param args.reason - 失敗理由（dev-only）
     * @param args.error - 例外（dev-only）
     * @returns public outcome
     */
    const settleOutcomeInternal = ({
        traceId,
        stage,
        status,
        reason,
        error
    }: {
        traceId: string;
        stage: OutcomeStage;
        status: OutcomeInternalStatus;
        reason?: string;
        error?: unknown;
    }): LayergeOutcomePublic => {
        const internalOutcome = createInternalOutcome({
            traceId: traceId,
            stage: stage,
            status: status,
            reason: reason
        });
        const publicOutcome = projectOutcomeToPublic(internalOutcome);

        try {
            decisionTraceStore.settle(traceId);
        } catch {
            // ignore
        }

        logOutcomeOneLineInternal(internalOutcome, publicOutcome);

        if (internalOutcome.status === 'failed') {
            logFailedHintInternal(internalOutcome.traceId);
        }

        logOutcomeInternal(internalOutcome, error);

        return publicOutcome;
    };

    /**
     * beforeUnloadEnabled - beforeunload の有効状態
     * @type {boolean}
     */

    /**
     * onBeforeUnload - beforeunload ハンドラ
     * @param e - event
     * @returns
     */
    const onBeforeUnload = (e: BeforeUnloadEvent): string | void => {
        // ブラウザ仕様により message の表示は保証されません
        e.preventDefault();
        e.returnValue = '';
        return '';
    };
    void onBeforeUnload;

    /**
     * presenterDefaults - Presenter の mount 既定値（v3.0）
     * @type {{preMounted?:boolean, keepMounted?:boolean, mountPreset?:'default'|'keep'|'pre'|'prekeep'}|null}
     */
    const presenterDefaults =
        options.presenterDefaults && typeof options.presenterDefaults === 'object'
            ? options.presenterDefaults
            : null;

    /**
     * controlledHooks - 制御型 hooks（v3.0 / opt-in）
     * @type {{beforeOpen?:Function, beforeClose?:Function, beforeNavigate?:Function}|null}
     */
    const controlledHooks =
        options.controlledHooks && typeof options.controlledHooks === 'object'
            ? options.controlledHooks
            : null;

    // v3.0: controlledHooks は latest-wins と整合させる（superseded の結果は採用しない）
    /** @type {Record<'beforeOpen'|'beforeClose'|'beforeNavigate', number>} */
    const controlledHookTokens = {beforeOpen: 0, beforeClose: 0, beforeNavigate: 0};

    const controlledHookControllers: Record<
        'beforeOpen' | 'beforeClose' | 'beforeNavigate',
        AbortController | null
    > = {beforeOpen: null, beforeClose: null, beforeNavigate: null};

    /**
     * hasControlledHook - controlledHooks が指定されているか
     * @param hookName
     * @returns
     */
    const hasControlledHook = (hookName: 'beforeOpen' | 'beforeClose' | 'beforeNavigate'): boolean => {
        const fn = controlledHooks ? controlledHooks[hookName] : undefined;
        return typeof fn === 'function';
    };

    /**
     * runControlledHookMaybe - controlledHooks を実行し、結果に応じて続行可否を返します
     * - hook が未指定なら同期で {ok:true} を返す（v1系テスト互換）
     * - false / throw は中止
     * - Promise は await（latest-wins: 新しい呼び出しが来たら旧結果は採用しない）
     * @param hookName
     * @param ctx
     * @returns | Promise<{ok:boolean, signal:AbortSignal}>}
     */
    const runControlledHookMaybe = (
        hookName: 'beforeOpen' | 'beforeClose' | 'beforeNavigate',
        ctx: Omit<LayergeControlledHookContext, 'signal'>
    ): {ok: boolean; signal: AbortSignal} | Promise<{ok: boolean; signal: AbortSignal}> => {
        const fn = controlledHooks ? controlledHooks[hookName] : undefined;

        // No hook -> sync allow
        if (typeof fn !== 'function') {
            const controller = new AbortController();
            return {ok: true, signal: controller.signal};
        }

        // Abort the previous invocation (latest-wins).
        const prev = controlledHookControllers[hookName];
        if (prev) {
            try {
                prev.abort();
            } catch {
                // ignore
            }
        }

        const controller = new AbortController();
        controlledHookControllers[hookName] = controller;
        controlledHookTokens[hookName] += 1;
        const token = controlledHookTokens[hookName];

        const signal = controller.signal;
        const safeCtx = Object.assign({}, ctx, {signal: signal});

        const normalize = (value: unknown) => {
            if (controlledHookTokens[hookName] != token) return {ok: false, signal: signal};
            if (signal.aborted) return {ok: false, signal: signal};
            if (value === false) return {ok: false, signal: signal};
            return {ok: true, signal: signal};
        };

        try {
            const result = fn(safeCtx);
            if (result && typeof (result as Promise<boolean | void>).then === 'function') {
                return (result as Promise<boolean | void>)
                    .then(normalize)
                    .catch(() => ({ok: false, signal: signal}));
            }
            return normalize(result);
        } catch {
            return {ok: false, signal: signal};
        }
    };

    /**
     * presenterComponentIds - Component を安定IDへ変換するための WeakMap（keepMounted用）
     * @type {WeakMap<object, string>}
     */
    const presenterComponentIds = new WeakMap();

    /**
     * getPresenterComponentId - Component から keepMounted 用の安定IDを取得します
     * @param component - 対象コンポーネント
     * @returns 安定ID
     */
    const getPresenterComponentId = (component: import('vue').Component): string => {
        // NOTE: Vue Component は object/function を取りうる。WeakMap の key は object のみ。
        const key = /** @type {any} */ component;

        if (!key || (typeof key !== 'object' && typeof key !== 'function')) {
            return 'component_unknown';
        }

        const existing = presenterComponentIds.get(key);

        if (existing) {
            return existing;
        }

        const id = createId('component');
        presenterComponentIds.set(key, id);
        return id;
    };

    /**
     * expandMountPreset - mountPreset を展開します
     * @param preset - プリセット
     * @returns |null} 展開結果。preset未指定の場合はnull。
     */
    const expandMountPreset = (
        preset: 'default' | 'keep' | 'pre' | 'prekeep' | undefined
    ): {preMounted: boolean; keepMounted: boolean} | null => {
        if (preset === 'default') {
            return {preMounted: false, keepMounted: false};
        }

        if (preset === 'keep') {
            return {preMounted: false, keepMounted: true};
        }

        if (preset === 'pre') {
            return {preMounted: true, keepMounted: false};
        }

        if (preset === 'prekeep') {
            return {preMounted: true, keepMounted: true};
        }

        return null;
    };

    /**
     * resolveMountOptions - mount options を凍結仕様の優先順位で展開します
     * 優先順位:
     * 1) options（呼び出し時）
     * 2) presenterDefaults（createLayerge）
     * 3) fallback（false/false）
     * @param callOptions - 呼び出し時 options
     * @returns } 展開結果
     */
    const resolveMountOptions = (
        callOptions: Record<string, unknown>
    ): {preMounted: boolean; keepMounted: boolean} => {
        const fromCallPreset = expandMountPreset(
            callOptions.mountPreset as 'default' | 'keep' | 'pre' | 'prekeep' | undefined
        );
        const fromDefaultsPreset = expandMountPreset(
            presenterDefaults ? presenterDefaults.mountPreset : undefined
        );

        const preMountedRaw = /** @type {any} */ callOptions.preMounted;
        const keepMountedRaw = /** @type {any} */ callOptions.keepMounted;

        const preMountedDefaultRaw = presenterDefaults ? presenterDefaults.preMounted : undefined;
        const keepMountedDefaultRaw = presenterDefaults ? presenterDefaults.keepMounted : undefined;

        // 1) call preset
        if (fromCallPreset) {
            return fromCallPreset;
        }

        // 1) call explicit values
        if (typeof preMountedRaw === 'boolean' || typeof keepMountedRaw === 'boolean') {
            return {
                preMounted: typeof preMountedRaw === 'boolean' ? preMountedRaw : false,
                keepMounted: typeof keepMountedRaw === 'boolean' ? keepMountedRaw : false
            };
        }

        // 2) defaults preset
        if (fromDefaultsPreset) {
            return fromDefaultsPreset;
        }

        // 2) defaults explicit values
        if (typeof preMountedDefaultRaw === 'boolean' || typeof keepMountedDefaultRaw === 'boolean') {
            return {
                preMounted: typeof preMountedDefaultRaw === 'boolean' ? preMountedDefaultRaw : false,
                keepMounted: typeof keepMountedDefaultRaw === 'boolean' ? keepMountedDefaultRaw : false
            };
        }

        // 3) fallback
        return {preMounted: false, keepMounted: false};
    };

    /**
     * historyPresenterRecords - push で作られた Presenter を Forward 復元するための内部レコード
     *
     * NOTE: v2.x では「push → back → forward」の同一セッション内復元を最小で保証する。
     * - replace/open は対象外
     * - ブラウザ履歴の state には entryId 等の識別子のみを刻み、実体はこの Map で引けるようにする
     * @type {Map<string, {presenterName:string, viewComponent:import('vue').Component|null}>}
     */
    const historyPresenterRecords = markRaw(new Map());

    /**
     * warnDev - 開発時のみ警告を出します（debug:true のとき）
     * @param message - 警告メッセージ
     * @param [data] - 警告に関連する追加情報（キーバリューペア）
     * @returns
     */
    const warnDev = (message: string, data?: Record<string, unknown>): void => {
        // 開発環境かつデバッグモードが有効な場合のみ警告を出力
        if (!isDevelopmentMode || !debug) {
            return;
        }

        console.warn('[Layerge][warn]', message, data);
    };

    /**
     * mergeHistoryStateInternal - history.state を破壊せずに merge 更新します
     *
     * NOTE: vue-router が内部で保持する state を潰すと事故るため、必ず top-level merge する。
     * @param patch - 追加する state
     * @returns
     */
    const mergeHistoryStateInternal = (patch: Record<string, unknown>): void => {
        try {
            const h = typeof globalThis !== 'undefined' ? globalThis.history : undefined;

            if (!h || typeof h.replaceState !== 'function') {
                return;
            }

            const current = h.state && typeof h.state === 'object' ? h.state : {};

            // NOTE: history.state は StructuredClone されるため、参照型を直接引き回さない
            const nextState = {
                ...current,
                ...patch
            };

            // url は指定しない（現在のURLを維持）
            h.replaceState(nextState, '');
        } catch {
            // ignore
        }
    };

    /**
     * readLayergeHistoryStateInternal - 現在の history.state から Layerge 用情報を読み取ります
     * @returns |null} Layerge state、存在しない場合は null
     */
    const readLayergeHistoryStateInternal = (): {
        mode: 'presenter';
        entryId: string;
        toFullPath: string;
    } | null => {
        try {
            const h = typeof globalThis !== 'undefined' ? globalThis.history : undefined;

            if (!h || !h.state || typeof h.state !== 'object') {
                return null;
            }

            const state = /** @type {any} */ h.state;
            const layerge = state.layerge;

            if (!layerge || typeof layerge !== 'object') {
                return null;
            }

            if (layerge.mode !== 'presenter') {
                return null;
            }

            if (typeof layerge.entryId !== 'string' || layerge.entryId.length === 0) {
                return null;
            }

            if (typeof layerge.toFullPath !== 'string' || layerge.toFullPath.length === 0) {
                return null;
            }

            return {
                mode: 'presenter',
                entryId: layerge.entryId,
                toFullPath: layerge.toFullPath
            };
        } catch {
            return null;
        }
    };

    /**
     * navigationToken - 最新操作識別用のトークン（latest-wins制御）
     * @type {number}
     */
    let navigationToken = 0;

    /**
     * closingIds - close が進行中の entryId（beforeClose を await するための多重呼び出し抑止）
     * @type {Set<string>}
     */
    const closingIds = new Set();

    // Presenter定義が渡されている場合はそれを使用、なければ空オブジェクト
    const presenters = options.presenters ? options.presenters : {};

    /**
     * parseDisplay - displayオプションをstack/cache設定に変換します（v1.x）
     * - 'top'         => stack:false, cache:false
     * - 'stack'       => stack:true,  cache:false
     * - 'stack+cache' => stack:true,  cache:true
     * @param value - 解析対象の値
     * @throws {Error} 不正なdisplay値の場合にスロー
     * @returns |null} 解析結果、nullまたは未定義の場合はnull
     */
    const parseDisplay = (value: unknown): {stack: boolean; cache: boolean} | null => {
        // displayオプションが未定義またはnullの場合はnullを返す
        if (value === undefined || value === null) {
            return null;
        }

        // 'top'の場合はstack・cache共にfalse
        if (value === 'top') {
            return {stack: false, cache: false};
        }
        // 'stack'の場合はstackのみtrue
        if (value === 'stack') {
            return {stack: true, cache: false};
        }
        // 'stack+cache'の場合はstack・cache共にtrue
        if (value === 'stack+cache') {
            return {stack: true, cache: true};
        }

        throw new Error(`[Layerge] Unknown display value: ${String(value)}`);
    };

    // デフォルト設定（後方互換性維持）
    // - displayオプションが指定されている場合はstack/cacheより優先
    const defaultFromDisplay = parseDisplay(options.display);
    // displayオプションが指定されている場合はそのstack設定、なければoptions.stackの真偽値
    const defaultStack = defaultFromDisplay ? defaultFromDisplay.stack : options.stack === true;
    // displayオプションが指定されている場合はそのcache設定、なければoptions.cacheの真偽値
    const defaultCache = defaultFromDisplay ? defaultFromDisplay.cache : options.cache === true;

    const normalizedPresenters: Record<string, PresenterDefinition> = {};

    for (const name of Object.keys(presenters)) {
        const def = (presenters as Record<string, PresenterDefinition>)[name];

        // Presenter定義が存在しない、またはcomponentが未定義の場合はエラー
        if (!def || !def.component) {
            throw new Error(`[Layerge] Presenter definition has no component: ${name}`);
        }

        const defDisplay = parseDisplay(def.display);

        // displayオプションが指定されているのに、stack/cacheも指定されている場合は警告
        if (defDisplay && (def.stack !== undefined || def.cache !== undefined)) {
            warnDev('`display` overrides `stack/cache` in presenter definition', {
                presenter: name,
                display: def.display,
                stack: def.stack,
                cache: def.cache
            });
        }

        // displayオプション指定時はそちらを優先、未指定時はdef.stack、さらに未指定時はデフォルト値を使用
        let normalizedStack;

        if (defDisplay) {
            normalizedStack = defDisplay.stack;
        } else if (def.stack !== undefined) {
            normalizedStack = def.stack === true;
        } else {
            normalizedStack = defaultStack;
        }

        // displayオプション指定時はそちらを優先、未指定時はdef.cache、さらに未指定時はデフォルト値を使用
        let normalizedCache;

        if (defDisplay) {
            normalizedCache = defDisplay.cache;
        } else if (def.cache !== undefined) {
            normalizedCache = def.cache === true;
        } else {
            normalizedCache = defaultCache;
        }

        // v1.xではcacheを有効にするにはstackが必須（整合性チェック）
        if (normalizedCache === true && normalizedStack !== true) {
            throw new Error(
                `[Layerge] Presenter "${name}" has cache:true but stack:false. cache requires stack in v1.`
            );
        }

        // 最終的なdisplay値を決定（cache有効なら'stack+cache'、stack有効なら'stack'、どちらも無効なら'top'）
        const display = normalizedCache ? 'stack+cache' : normalizedStack ? 'stack' : 'top';

        // Vue が component オブジェクトを reactive 化しないようにする
        normalizedPresenters[name] = {
            component: markRaw(def.component),
            stack: normalizedStack,
            cache: normalizedCache,
            display: display
        };
    }

    const $layerge = createLayergeStore(normalizedPresenters);

    // v1.x: LayergeTransition を使う entry を追跡します。
    // Transition を使わない Presenter（=非アニメ想定）では enter/leave を自動で完了させます。
    // - LayergeTransition が mounted したら add
    // - unmounted したら delete
    // NOTE: これは内部用で、公開 State ではありません。
    $layerge._transitionManagedEntryIds = new Set();

    // v2: Invoker
    // - entryId と trigger DOM を結びつける最小コア
    // - a11y保証はしない（必要な人が上に積む）
    // NOTE: 破棄は leave 完了（notifyLeaveDone）と同期します
    if (!$layerge._invokers) {
        $layerge._invokers = markRaw(new Map());
    }

    /**
     * isHTMLElement - HTMLElement 判定（SSR/テストで安全に動作させる）
     * @param el - 判定対象
     * @returns HTMLElement の場合 true
     */
    const isHTMLElement = (el: unknown): el is HTMLElement => {
        try {
            return typeof HTMLElement !== 'undefined' && el instanceof HTMLElement;
        } catch {
            // Fallback: nodeType===1 (Element)
            return !!(el && typeof el === 'object' && (el as {nodeType?: number}).nodeType === 1);
        }
    };

    /**
     * setInvokerInternal - entryId と起動元DOMを紐づけます（v2）
     * @param entryId - 対象 entryId
     * @param el - 起動元DOM
     * @returns
     */
    const setInvokerInternal = (entryId: string, el: unknown): void => {
        if (typeof entryId !== 'string' || entryId.length === 0) {
            warnDev('setInvokerInternal: invalid entryId.', {entryId: entryId});
            return;
        }

        if (!isHTMLElement(el)) {
            warnDev('setInvokerInternal: el is not an HTMLElement.', {entryId: entryId, el: el});
            return;
        }

        try {
            $layerge._invokers.set(entryId, {entryId: entryId, el: el});
        } catch (e) {
            warnDev('setInvokerInternal: failed to set invoker.', {entryId: entryId, error: e});
        }
    };

    /**
     * getInvokerInternal - entryId に紐づく invoker を取得します（v2）
     * @param entryId - 対象 entryId
     * @returns invoker（存在しない場合 null）
     */
    const getInvokerInternal = (entryId: string): import('../types').LayergeInvoker | null => {
        try {
            return $layerge._invokers.get(entryId) ?? null;
        } catch {
            return null;
        }
    };

    /**
     * deleteInvokerInternal - entryId に紐づく invoker を破棄します（v2）
     * @param entryId - 対象 entryId
     * @returns
     */
    const deleteInvokerInternal = (entryId: string): void => {
        try {
            $layerge._invokers.delete(entryId);
        } catch {
            // ignore
        }
    };

    // v2: invoker 操作API（内部用）
    // - useLayergeLink 等の composable から利用される想定
    $layerge._setInvoker = setInvokerInternal;
    $layerge._getInvoker = getInvokerInternal;
    $layerge._deleteInvoker = deleteInvokerInternal;

    /**
     * isTransitionManaged - entryId が LayergeTransition により管理されているか
     * @param entryId - 対象 entryId
     * @returns 管理されている場合 true
     */
    const isTransitionManaged = (entryId: string): boolean => {
        try {
            return $layerge._transitionManagedEntryIds && $layerge._transitionManagedEntryIds.has(entryId);
        } catch {
            return false;
        }
    };

    /**
     * scheduleAutoEnterDone - 非アニメ（Transition未使用）向けの enter 完了通知を予約します
     * @param entryId - 対象 entryId
     * @returns
     */
    const scheduleAutoEnterDone = (entryId: string): void => {
        // LayergeTransition が mounted していればスキップ
        nextTick(() => {
            if (isTransitionManaged(entryId)) {
                return;
            }

            if (typeof $layerge._notifyEnterDone === 'function') {
                $layerge._notifyEnterDone(entryId);
            }
        });
    };

    /**
     * scheduleAutoLeaveDone - 非アニメ（Transition未使用）向けの leave 完了通知を予約します
     * @param entryId - 対象 entryId
     * @returns
     */
    const scheduleAutoLeaveDone = (entryId: string): void => {
        nextTick(() => {
            if (isTransitionManaged(entryId)) {
                return;
            }

            if (typeof $layerge._notifyLeaveDone === 'function') {
                $layerge._notifyLeaveDone(entryId);
            }
        });
    };

    // demo/real-world safety: exit presenter mode only after a navigation is confirmed
    let exitOnNextSuccess = false;
    let exitTargetFullPath: string | null = null;

    /**
     * staleNavs - latest-wins で「置き換えられた旧ナビ」の記録
     *
     * vue-router のガードが Promise の場合、旧ナビが後から再開して beforeEach を通ることがあります。
     * そのときに Presenter 文脈破棄（exitPresenterMode）を誤って走らせないため、
     * 対象 fullPath を短時間だけ記録してガード内でキャンセルします。
     * @type {Map<string, number>}
     */
    const staleNavs = new Map();
    const STALE_NAV_TTL_MS = 15000;

    const backgroundCompare = options.backgroundCompare ? options.backgroundCompare : 'fullPath';

    /**
     * isSameAsBackground - 遷移先が背景と一致するか判定します
     * @param toRoute - 遷移先
     * @returns 一致する場合 true
     */
    const isSameAsBackground = (toRoute: import('vue-router').RouteLocationNormalizedLoaded): boolean => {
        // 背景ルートが設定されていない場合は一致しない
        if (!$layerge.backgroundRoute) {
            return false;
        }

        // pathモードの場合はpath部分のみで比較
        if (backgroundCompare === 'path') {
            return toRoute.path === $layerge.backgroundRoute.path;
        }

        // デフォルト（fullPathモード）の場合はfullPathで比較
        return toRoute.fullPath === $layerge.backgroundRoute.fullPath;
    };

    /**
     * assertValidRoute - ルートが有効か検証します
     * @param route - 解決済みルート
     * @param [allowUnmatched] - true の場合、未マッチ route（matched.length===0）を許容します（url 用途）
     * @throws {Error} 無効ルートの場合にスロー
     * @returns
     */
    const assertValidRoute = (
        route: import('vue-router').RouteLocationNormalizedLoaded,
        allowUnmatched: boolean = false
    ): void => {
        // 未マッチルートが許可されておらず、実際にマッチしていない場合はエラー
        if (!allowUnmatched && (!route.matched || route.matched.length === 0)) {
            throw new Error('[Layerge] Invalid route (no matched records).');
        }

        // fullPathが文字列でない場合は無効なルート
        if (typeof route.fullPath !== 'string') {
            throw new Error('[Layerge] Invalid route (fullPath must be a string).');
        }
    };

    /**
     * cancelPendingNavIfAny - 未確定の Presenter 遷移をキャンセルします
     * - v1.x: 最新操作が勝つ（pending は置き換える）
     * @returns
     */
    const cancelPendingNavIfAny = (): void => {
        const pending: PendingWithTrace | null = $layerge.pending;

        // TODO: 将来的にはpendingの管理方法を改善して競合状態をより確実に回避する
        // 未確定の遷移が存在しない場合は何もしない
        if (!pending) {
            return;
        }

        // NOTE:
        // vue-router のガードが Promise の場合、pending を null にしても
        // 旧ナビが後から再開して Layerge の beforeEach に到達することがあります。
        // その旧ナビが presenter 文脈破棄を起こさないよう、短時間だけ fullPath を記録します。
        // 有効なfullPathが存在する場合のみstaleNavsに記録
        if (pending.route && typeof pending.route.fullPath === 'string') {
            staleNavs.set(pending.route.fullPath, Date.now());
        }

        $layerge.pending = null;

        // v2: pending は commit されていないため leave 完了通知が来ない
        // ここで invoker を確実に片付ける
        deleteInvokerInternal(pending.id);

        (pending.handle as PresenterHandleInternal)._setActive(false);
        (pending.handle as PresenterHandleInternal)._resolveSettled({status: 'superseded'});
        (pending.handle as PresenterHandleInternal)._resolveClosed();

        if (pending.traceId && pending.traceSettled !== true) {
            try {
                decisionTraceStore.push(pending.traceId, 'latestWins', {reason: 'superseded'});
            } catch {
                // ignore
            }

            settleOutcomeInternal({
                traceId: pending.traceId,
                stage: 'navigate',
                status: 'superseded',
                reason: 'latestWins'
            });

            pending.traceSettled = true;
        }
    };

    /**
     * assertPresenterRegistered - Presenter 登録を確認します
     * @param presenterName - Presenter 名
     * @throws {Error} 未登録の場合にスロー
     * @returns
     */
    const assertPresenterRegistered = (presenterName: string): void => {
        const def = $layerge.presenters[presenterName];

        if (!def) {
            throw new Error(`[Layerge] Presenter is not registered: ${presenterName}`);
        }

        if (!def.component) {
            throw new Error(`[Layerge] Presenter definition has no component: ${presenterName}`);
        }
    };

    /**
     * enterPresenterModeIfNeeded - Presenter モードへ遷移します
     * @returns
     */
    const enterPresenterModeIfNeeded = (): void => {
        if ($layerge.mode !== 'presenter') {
            $layerge.mode = 'presenter';
        }
    };

    /**
     * captureBackgroundBeforeFirstPresenter - 0→1 の瞬間だけ背景を固定します（遷移前に実行する）
     * @returns
     */
    const captureBackgroundBeforeFirstPresenter = (): void => {
        if ($layerge.stack.length !== 0) {
            return;
        }

        const bg = router.resolve(router.currentRoute.value.fullPath);

        $layerge.backgroundRoute = markRaw(bg);
        $layerge.freezeBackground = true;
    };

    /**
     * exitPresenterMode - Presenter モードを終了します（履歴は操作しない）
     * @returns
     */
    const exitPresenterMode = (): void => {
        $layerge.backgroundRoute = null;
        $layerge.freezeBackground = false;

        clearPresenterOverlay();
    };

    /**
     * moveEntryToLeaving - entry を leaving へ移動します（leave演出のためDOM保持）
     * @param entry - 対象 entry
     * @param leavingIndex - leave 開始時点の index
     * @param leavingDepth - leave 開始時点の depth
     * @returns
     */
    const moveEntryToLeaving = (
        entry: import('../types').PresenterEntry,
        leavingIndex: number,
        leavingDepth: number
    ): void => {
        entry.phase = 'leave';
        entry._leavingIndex = leavingIndex;
        entry._leavingDepth = leavingDepth;

        // close は冪等：再closeや誤操作を防ぐ
        (entry.handle as PresenterHandleInternal)._setActive(false);

        $layerge.leaving.push(entry);

        // v1.x: LayergeTransition を使わない Presenter（=非アニメ）では、
        // leave を即完了させて leaving が残り続けないようにする。
        scheduleAutoLeaveDone(entry.id);
    };

    /**
     * moveStackEntriesToLeaving - stack の範囲を leaving に移動します
     * @param fromIndexInclusive - 移動開始 index（含む）
     * @returns
     */
    const moveStackEntriesToLeaving = (fromIndexInclusive: number): void => {
        const originalDepth = $layerge.stack.length;

        for (let i = originalDepth - 1; i >= fromIndexInclusive; i--) {
            const stackEntry = $layerge.stack.pop();

            if (!stackEntry) {
                continue;
            }

            moveEntryToLeaving(stackEntry, i, originalDepth);
        }
    };

    /**
     * clearPresenterOverlay - overlay だけを閉じます（背景freezeは維持）
     * @returns
     */
    const clearPresenterOverlay = (): void => {
        // pending は commit されていないため即時閉じ（leave不要）
        cancelPendingNavIfAny();

        // leaving 保持（必ず描画対象）
        if ($layerge.stack.length > 0) {
            moveStackEntriesToLeaving(0);
        }

        $layerge.pending = null;
        $layerge.mode = 'page';
    };

    /**
     * closeByIdInternal - ID を指定して Presenter を閉じます（URL復元を含む）
     * @param {string} id - 対象ID
     * @param {{restoreUrl?: boolean}|undefined} [options] - オプション
     * @returns {void}
     */
    /**
     * closeByIdInternalAsync - ID を指定して Presenter を閉じます（await用）
     * @param id - 対象ID
     * @param [options] - オプション
     * @returns 結果
     */
    const closeByIdInternalAsync = async (
        id: string,
        options?: {restoreUrl?: boolean} | undefined
    ): Promise<import('../types').PresenterAsyncResult> => {
        const traceId = createId('trace');

        try {
            decisionTraceStore.start(traceId);
            decisionTraceStore.push(traceId, 'resolveTarget', {entryId: id, action: 'closeAsync'});
        } catch {
            // ignore
        }

        // beforeClose を await するため、同一IDへの close 多重呼び出しを抑止
        if (closingIds.has(id)) {
            const publicOutcome = settleOutcomeInternal({
                traceId: traceId,
                stage: 'close',
                status: 'superseded',
                reason: 'latestWins'
            });

            return {status: publicOutcome.status};
        }

        closingIds.add(id);

        const finalize = () => {
            closingIds.delete(id);
        };

        const proceed = async () => {
            const index = $layerge.stack.findIndex((entry) => entry.id === id);

            if (index < 0) {
                return false;
            }

            const traceId = createId('trace');

            try {
                decisionTraceStore.start(traceId);
                decisionTraceStore.push(traceId, 'resolveTarget', {entryId: id, action: 'close'});
            } catch {
                // ignore
            }

            const restoreUrl = options && options.restoreUrl === false ? false : true;
            const isTopClose = index === $layerge.stack.length - 1;

            if (!isTopClose && restoreUrl) {
                warnDev('close() called for a non-top entry. URL restore is disabled for safety.', {id: id});
            }

            const actionEntry = $layerge.stack[$layerge.stack.length - 1];
            const actionNavType = actionEntry ? actionEntry.navType : 'open';
            const actionReturnTo = actionEntry ? actionEntry.returnTo : null;

            moveStackEntriesToLeaving(index);

            if ($layerge.stack.length === 0) {
                const needsUrlRestore =
                    restoreUrl && (actionNavType === 'push' || actionNavType === 'replace');

                if (needsUrlRestore) {
                    clearPresenterOverlay();
                } else {
                    exitPresenterMode();
                }
            }

            if (!restoreUrl || !isTopClose) {
                return true;
            }

            const navBack = () => {
                // vue-router provides router.back(), but unit tests may use a minimal mock.
                if (typeof router.back === 'function') {
                    router.back();
                    return;
                }

                if (typeof router.go === 'function') {
                    router.go(-1);
                }
            };

            if (actionNavType === 'push') {
                navBack();
                return true;
            }

            if (actionNavType === 'replace') {
                if (typeof actionReturnTo !== 'string' || actionReturnTo.length === 0) {
                    warnDev('replace-close has no returnTo. Falling back to router.back().', {
                        id: id,
                        returnTo: actionReturnTo
                    });
                    navBack();
                    return true;
                }

                const navP = router.replace(actionReturnTo);

                if (navP && typeof (/** @type {any} */ navP.then) === 'function') {
                    await navP;
                }
                return true;
            }

            return true;
        };

        // controlledHooks（opt-in） + leaveGuard（opt-in）
        // - leaveGuard は usePresenterLeaveGuard() を使っている entry のみに適用されます
        // - controlledHooks.beforeClose は既存仕様のまま
        try {
            try {
                decisionTraceStore.push(traceId, 'runHook', {hook: 'leaveGuard'});
            } catch {
                // ignore
            }

            const okLeaveGuard = await __layergeRunPresenterLeaveGuard({entryId: id, reason: 'close'});

            if (okLeaveGuard === false) {
                // close がキャンセルされた場合は isActive を復元する
                const idx = $layerge.stack.findIndex((entry) => entry.id === id);
                const entry = idx >= 0 ? $layerge.stack[idx] : null;
                if (entry) {
                    (entry.handle as PresenterHandleInternal)._setActive(true);
                }

                const publicOutcome = settleOutcomeInternal({
                    traceId: traceId,
                    stage: 'close',
                    status: 'aborted',
                    reason: 'leaveGuard'
                });

                return {status: publicOutcome.status};
            }

            let gate = {ok: true};

            if (hasControlledHook('beforeClose')) {
                try {
                    decisionTraceStore.push(traceId, 'runHook', {hook: 'beforeClose'});
                } catch {
                    // ignore
                }

                gate = await runControlledHookMaybe('beforeClose', {entryId: id, action: 'close'});
            }

            if (!gate || gate.ok === false) {
                const idx = $layerge.stack.findIndex((entry) => entry.id === id);
                const entry = idx >= 0 ? $layerge.stack[idx] : null;
                if (entry) {
                    (entry.handle as PresenterHandleInternal)._setActive(true);
                }

                const publicOutcome = settleOutcomeInternal({
                    traceId: traceId,
                    stage: 'close',
                    status: 'blocked',
                    reason: 'beforeClose'
                });

                return {status: publicOutcome.status};
            }

            try {
                decisionTraceStore.push(traceId, 'commitLeaving', {entryId: id});
            } catch {
                // ignore
            }

            const did = await proceed();

            const publicOutcome = settleOutcomeInternal({
                traceId: traceId,
                stage: 'close',
                status: did ? 'completed' : 'aborted',
                reason: did ? undefined : 'notFound'
            });

            return {status: publicOutcome.status};
        } catch (e) {
            try {
                decisionTraceStore.push(traceId, 'error', {
                    message:
                        e && typeof e === 'object' && 'message' in e
                            ? /** @type {any} */ e.message
                            : String(e)
                });
            } catch {
                // ignore
            }

            const publicOutcome = settleOutcomeInternal({
                traceId: traceId,
                stage: 'close',
                status: 'failed',
                reason: 'exception',
                error: e
            });

            return {status: publicOutcome.status};
        } finally {
            finalize();
        }
    };

    /**
     * closeByIdInternal - ID を指定して Presenter を閉じます（URL復元を含む）
     * @param id - 対象ID
     * @param [options] - オプション
     * @returns
     */
    const closeByIdInternal = (id: string, options?: {restoreUrl?: boolean} | undefined): void => {
        // NOTE:
        // v1.x unit tests expect close() side effects (stack->leaving, state update)
        // to be observable synchronously when no async gates are involved.

        // 多重 close を抑止（async wrapper と整合）
        if (closingIds.has(id)) {
            return;
        }

        const index = $layerge.stack.findIndex((entry) => entry.id === id);
        const entry = index >= 0 ? $layerge.stack[index] : null;

        if (!entry) {
            return;
        }

        // leaveGuard が登録されている場合は async パスに委譲
        if (__layergeHasPresenterLeaveGuard(id)) {
            closeByIdInternalAsync(id, options);
            return;
        }

        // controlledHooks.beforeClose が Promise を返す可能性がある場合は async パスに委譲
        if (hasControlledHook('beforeClose')) {
            const gateMaybe = runControlledHookMaybe('beforeClose', {entryId: id, action: 'close'});

            if (
                gateMaybe &&
                typeof (gateMaybe as Promise<{ok: boolean; signal: AbortSignal}>).then === 'function'
            ) {
                closeByIdInternalAsync(id, options);
                return;
            }

            const gate = gateMaybe as {ok?: boolean} | null | undefined;

            if (!gate || gate.ok === false) {
                // close がキャンセルされた場合は isActive を復元する
                (entry.handle as PresenterHandleInternal)._setActive(true);
                return;
            }
        }

        const traceId = createId('trace');

        try {
            decisionTraceStore.start(traceId);
            decisionTraceStore.push(traceId, 'resolveTarget', {entryId: id, action: 'close'});
        } catch {
            // ignore
        }

        /**
         * finalizeOutcome - close の Outcome を確定します
         * @param status - 内部ステータス
         * @param reason - 失敗理由（dev-only）
         * @param error - 例外（dev-only。failed のときスタックが出力される）
         */
        const finalizeOutcome = (status: OutcomeInternalStatus, reason?: string, error?: unknown): void => {
            settleOutcomeInternal({
                traceId: traceId,
                stage: 'close',
                status: status,
                reason: reason,
                error: error
            });
        };

        const restoreUrl = options && options.restoreUrl === false ? false : true;
        const isTopClose = index === $layerge.stack.length - 1;

        if (!isTopClose && restoreUrl) {
            warnDev('close() called for a non-top entry. URL restore is disabled for safety.', {id: id});
        }

        const actionEntry = $layerge.stack[$layerge.stack.length - 1];
        const actionNavType = actionEntry ? actionEntry.navType : 'open';
        const actionReturnTo = actionEntry ? actionEntry.returnTo : null;

        moveStackEntriesToLeaving(index);

        if ($layerge.stack.length === 0) {
            const needsUrlRestore = restoreUrl && (actionNavType === 'push' || actionNavType === 'replace');

            if (needsUrlRestore) {
                clearPresenterOverlay();
            } else {
                exitPresenterMode();
            }
        }

        if (!restoreUrl || !isTopClose) {
            finalizeOutcome('completed');
            return;
        }

        const navBack = () => {
            if (typeof router.back === 'function') {
                router.back();
                return;
            }

            if (typeof router.go === 'function') {
                router.go(-1);
            }
        };

        if (actionNavType === 'push') {
            navBack();
            finalizeOutcome('completed');
            return;
        }

        if (actionNavType === 'replace') {
            if (typeof actionReturnTo !== 'string' || actionReturnTo.length === 0) {
                warnDev('replace-close has no returnTo. Falling back to router.back().', {
                    id: id,
                    returnTo: actionReturnTo
                });
                navBack();
                finalizeOutcome('completed');
                return;
            }

            const navP = router.replace(actionReturnTo);

            if (navP && typeof (/** @type {any} */ navP.then) === 'function') {
                /** @type {any} */ navP.then(() => {
                    finalizeOutcome('completed', 'restoreUrl');
                }).catch((err) => {
                    try {
                        decisionTraceStore.push(traceId, 'error', {
                            message: err instanceof Error ? err.message : String(err)
                        });
                    } catch {
                        // ignore
                    }

                    finalizeOutcome('failed', 'routerNavigationFailed', err);
                });

                return;
            }

            finalizeOutcome('completed', 'restoreUrl');
            return;
        }

        finalizeOutcome('completed');
    };

    /**
     * buildHandle - PresenterHandle を生成します
     * @param id - エントリID
     * @returns ハンドル
     */
    const buildHandle = (id: string): import('../types').PresenterHandleInternal => {
        return createPresenterHandle(id, () => {
            closeByIdInternal(id, undefined);
        });
    };

    /**
     * commitEntry - Presenter エントリを確定します（背景はここでは触らない）
     * @param {string} presenterName - 登録名
     * @param {import('../types').PresenterKind} kind - 種別
     * @param {import('vue-router').RouteLocationNormalizedLoaded} route - 実際に到達したルート
     * @param {import('../types').PresenterHandleInternal} handle - ハンドル
     * @param {import('vue').Component|null} viewComponent - 表示用コンポーネント（RouteLocationRaw の場合は null）
     * @param {import('../types').PresenterKind} navType - close 時に適用するナビ種別（URL を動かした場合のみ push/replace）
     * @param {string|null} returnTo - replace-close の戻り先（from.fullPath）。不要な場合は null。
     * @param mountOptions
     * @param mountOptions.preMounted
     * @param mountOptions.keepMounted
     * @param keepKey
     * @returns {void}
     */
    const commitEntry = (
        presenterName: string,
        kind: PresenterKind,
        route: RouteLocationNormalizedLoaded,
        handle: PresenterHandleInternal,
        viewComponent: Component | null,
        navType: PresenterKind,
        returnTo: string | null,
        mountOptions?: {preMounted: boolean; keepMounted: boolean},
        keepKey?: string | null
    ): void => {
        enterPresenterModeIfNeeded();

        const id = handle._id;
        const safeRoute = markRaw(route);

        const safeMountOptions: {preMounted?: boolean; keepMounted?: boolean} = mountOptions
            ? mountOptions
            : {};
        const preMounted = safeMountOptions.preMounted === true;
        const keepMounted = safeMountOptions.keepMounted === true;

        // v3: keepMounted/preMounted 用の安定キー
        const mountKey = keepMounted || preMounted ? createId('mount') : undefined;

        $layerge.stack.push({
            id: id,
            phase: 'enter',
            _mountKey: mountKey,
            _preMounted: preMounted,
            _keepMounted: keepMounted,
            _isHidden: preMounted === true ? true : false,
            _keepKey: keepKey,
            presenterName: presenterName,
            kind: kind,
            navType: navType,
            returnTo: returnTo,
            route: safeRoute,
            handle: handle,
            viewComponent: viewComponent ? viewComponent : null
        });

        // v3.2: opt-in async の settled 対象は「確定（settled）」のみ
        // - open/push/replace が commit された時点で completed とみなす
        handle._resolveSettled({status: 'completed'});

        if (preMounted === true) {
            // 最小: mount を先に発生させ、次tickで表示する
            nextTick(() => {
                const entry = $layerge.stack.find((x) => x.id === id);
                if (!entry) {
                    return;
                }

                // leave に入っていたら触らない
                if (entry.phase === 'leave') {
                    return;
                }

                entry._isHidden = false;
            });
        }

        // v1.x: LayergeTransition を使わない Presenter（=非アニメ）では、
        // notify を自動で補完して enter を完了させる。
        scheduleAutoEnterDone(id);
    };

    /**
     * isRouteTarget - targetがRouteLocationRawか判定します
     * @param target - 判定対象のtarget
     * @returns RouteLocationRawの場合true（型ガード）
     */
    const isRouteTarget = (target: unknown): target is import('vue-router').RouteLocationRaw => {
        if (typeof target === 'string') {
            return true;
        }

        if (!target || typeof target !== 'object') {
            return false;
        }

        if (
            'path' in target ||
            'name' in target ||
            'params' in target ||
            'query' in target ||
            'hash' in target
        ) {
            return true;
        }

        if ('fullPath' in target) {
            return true;
        }

        return false;
    };

    /**
     * isLoaderTarget - targetがloader関数か判定します
     * @param target - 判定対象のtarget
     * @returns loader関数の場合true（型ガード）
     */
    const isLoaderTarget = (target: unknown): target is () => Promise<import('vue').Component> => {
        // v1.x: loader は「引数なし関数」を想定（() => import('...')）
        return typeof target === 'function' && target.length === 0;
    };

    /**
     * toViewComponent - Component/loaderを描画用コンポーネントへ正規化します
     * @param target - 正規化対象のtarget（PresenterTarget型）
     * @returns 描画用コンポーネント（RouteLocationRawの場合はnull）
     */
    const toViewComponent = (target: import('../types').PresenterTarget): import('vue').Component | null => {
        if (isRouteTarget(target)) {
            return null;
        }

        if (isLoaderTarget(target)) {
            const loader = target;

            // loader は必要になるまで解決しない（state整合性の論点から切り離す）
            const asyncComp = defineAsyncComponent(() => {
                return Promise.resolve()
                    .then(() => {
                        return loader();
                    })
                    .then((m) => {
                        return m && (m as {default?: Component}).default
                            ? (m as {default?: Component}).default
                            : m;
                    });
            });

            return markRaw(asyncComp);
        }

        // Vue が reactive 化しないようにする
        return markRaw(target);
    };

    /**
     * ensureKeptArray - keepMounted 用の保持配列を初期化します
     * @returns kept 配列
     */
    const ensureKeptArray = (): import('../types').PresenterEntry[] => {
        if (!Array.isArray($layerge._kept)) {
            $layerge._kept = [];
        }

        return $layerge._kept;
    };

    /**
     * buildKeepKey - keepMounted の再利用キーを生成します
     * @param target - 呼び出し target
     * @param resolvedRoute - 解決済みルート
     * @param viewComponent - viewComponent
     * @returns 再利用キー
     */
    const buildKeepKey = (
        target: import('../types').PresenterTarget,
        resolvedRoute: import('vue-router').RouteLocationNormalizedLoaded,
        viewComponent: import('vue').Component | null
    ): string => {
        // Route ベース: 同一fullPathのみ再利用
        if (isRouteTarget(target)) {
            return `route:${resolvedRoute.fullPath}`;
        }

        // Component ベース: コンポーネントIDで再利用
        if (viewComponent) {
            return `component:${getPresenterComponentId(viewComponent)}`;
        }

        // fallback（通常到達しない）
        return `unknown:${resolvedRoute.fullPath}`;
    };

    /**
     * reuseKeptEntry - keepMounted の場合に kept entry を再利用します（openのみ）
     * @param presenterName - Presenter 名
     * @param kind - 種別（openのみ）
     * @param actual - 解決済みルート
     * @param viewComponent - viewComponent
     * @param keepKey - 再利用キー
     * @param mountOptions - 展開済み mount options
     * @param mountOptions.preMounted
     * @param mountOptions.keepMounted
     * @returns 再利用できた場合は handle。できなければ null。
     */
    const reuseKeptEntry = (
        presenterName: string,
        kind: PresenterKind,
        actual: import('vue-router').RouteLocationNormalizedLoaded,
        viewComponent: import('vue').Component | null,
        keepKey: string,
        mountOptions: {preMounted: boolean; keepMounted: boolean}
    ): import('../types').PresenterHandleInternal | null => {
        if (kind !== 'open') {
            return null;
        }

        const kept = ensureKeptArray();
        const index = kept.findIndex((e) => e && e._keepKey === keepKey && e.presenterName === presenterName);

        if (index < 0) {
            return null;
        }

        const entry = kept.splice(index, 1)[0];

        // 新しい handle / entryId を割り当てる（mountKey は維持）
        const id = createId(`${kind}_${presenterName}`);
        const handle = buildHandle(id);

        entry.id = id;
        entry.handle = handle;
        entry.phase = 'enter';
        entry.kind = 'open';
        entry.navType = 'open';
        entry.returnTo = null;
        entry.route = markRaw(actual);
        entry.viewComponent = viewComponent ? viewComponent : null;
        entry._preMounted = mountOptions.preMounted;
        entry._keepMounted = mountOptions.keepMounted;
        entry._keepKey = keepKey;

        // preMounted は「表示前に一度hiddenでmountしてよい」
        entry._isHidden = mountOptions.preMounted === true ? true : false;

        if (!entry._mountKey) {
            entry._mountKey = createId('mount');
        }

        $layerge.stack.push(entry);

        if (mountOptions.preMounted === true) {
            nextTick(() => {
                const inStack = $layerge.stack.find((x) => x.id === id);
                if (!inStack) {
                    return;
                }

                if (inStack.phase === 'leave') {
                    return;
                }

                inStack._isHidden = false;
            });
        }

        scheduleAutoEnterDone(id);
        return handle;
    };

    /**
     * presenterNavigate - Presenter API: open/push/replace を共通実装します
     * @param presenterName - Presenter 名
     * @param kind - 種別
     * @param target - to | Component | loader
     * @param options - オプション
     * @throws {Error} open(RouteLocationRaw) で未解決のルートを指定した場合にスロー
     * @returns ハンドル
     */
    const presenterNavigate = (
        presenterName: string,
        kind: import('../types').PresenterKind,
        target: import('../types').PresenterTarget,
        options:
            | import('../types').PresenterPushReplaceOptions
            | import('../types').PresenterOpenOptions
            | undefined
    ): import('../types').PresenterHandle => {
        assertPresenterRegistered(presenterName);

        // v1.x: 最新操作が勝つ
        cancelPendingNavIfAny();

        const safeOptions = options ? options : {};

        // open の options には url を持たせていない（誤用を型で抑止するため）。
        // ただし実装は誤用を検出して警告するために読み出す。
        const url = (safeOptions as PresenterPushReplaceOptions).url;

        const mountOptions = resolveMountOptions(safeOptions as Record<string, unknown>);

        if (url !== undefined && typeof url !== 'string' && typeof url !== 'object') {
            throw new Error('[Layerge] url must be a string or RouteLocationRaw.');
        }

        if (kind === 'open' && url !== undefined) {
            warnDev('open() ignores url.', {url: url});
        }

        // v3.0: url は push/replace のみ有効
        if ((kind === 'push' || kind === 'replace') && url !== undefined && isRouteTarget(target)) {
            warnDev(`${kind}() ignores url when target is RouteLocationRaw.`, {url: url});
        }

        const current = router.currentRoute.value;

        // NOTE: controlledHooks が async の場合でも、hook 未指定/同期結果なら同期で遷移を開始する
        const id = createId(`${kind}_${presenterName}`);
        const handle = buildHandle(id);
        const viewComponent = toViewComponent(target);

        // v4.0: traceId（dev-only, 公開APIではない）
        const traceId = createId('trace');
        /** @type {'open'|'navigate'|'close'|'restore'} */
        let traceStage: OutcomeStage = kind === 'open' ? 'open' : 'navigate';

        try {
            decisionTraceStore.start(traceId);
            decisionTraceStore.push(traceId, 'resolveTarget', {
                entryId: id,
                action: kind,
                presenterName: presenterName
            });
        } catch {
            // ignore
        }

        /**
         * cancelHandle - 未確定の操作を中断します（dev-only: internal Outcome を併設）
         * @param internalStatus - internal status
         * @param reason - 理由（dev-only）
         * @param error - error（failed の場合）
         * @returns
         */
        const cancelHandle = (
            internalStatus: 'aborted' | 'failed' | 'superseded' | 'blocked',
            reason: string | undefined,
            error: unknown
        ): void => {
            const publicStatus = settleOutcomeInternal({
                traceId: traceId,
                stage: traceStage,
                status: internalStatus,
                reason: reason,
                error: error
            });

            handle._setActive(false);
            handle._resolveSettled({status: publicStatus.status});
            handle._resolveClosed();
        };

        /**
         * completeTrace - commit（completed）のみを内部 Outcome として確定します
         * @param reason - 理由（dev-only）
         * @returns
         */
        const completeTrace = (reason: string | undefined): void => {
            settleOutcomeInternal({
                traceId: traceId,
                stage: traceStage,
                status: 'completed',
                reason: reason
            });
        };

        const runMaybeAsync = <T>(result: T | Promise<T>, cb: (value: T) => void): void => {
            const thenable = result as Promise<T>;

            if (result && typeof thenable.then === 'function') {
                thenable.then(cb);
                return;
            }
            cb(result as T);
        };

        // open(RouteLocationRaw) については view-only の警告を出す（v2互換）
        if (kind === 'open' && isRouteTarget(target)) {
            const resolvedOpen = router.resolve(target);
            assertValidRoute(resolvedOpen);

            if (resolvedOpen.fullPath !== current.fullPath) {
                warnDev(
                    'open(RouteLocationRaw) is view-only and does not navigate. URL/content may mismatch.',
                    {target: resolvedOpen.fullPath, current: current.fullPath}
                );
            }

            warnDev(
                'open(RouteLocationRaw) is view-only. It does not navigate or run guards. Prefer open(Component/loader) for overlays.',
                {to: resolvedOpen.fullPath}
            );
        }

        const doOpenCommit = () => {
            // 0→1 の瞬間は「遷移前」に背景を固定する
            captureBackgroundBeforeFirstPresenter();

            let actual = router.resolve(current.fullPath);

            if (isRouteTarget(target)) {
                actual = router.resolve(target);
            }

            const keepKey = mountOptions.keepMounted
                ? buildKeepKey(target, actual, viewComponent)
                : undefined;

            if (mountOptions.keepMounted && keepKey) {
                const reused = reuseKeptEntry(
                    presenterName,
                    kind,
                    actual,
                    viewComponent,
                    keepKey,
                    mountOptions
                );
                if (reused) {
                    // v3.0: reuse が発生した場合でも、この呼び出しの handle は成立させない（互換）
                    cancelHandle('aborted', 'reusedKeptEntry', undefined);
                    return;
                }
            }

            commitEntry(
                presenterName,
                kind,
                actual,
                handle,
                viewComponent,
                'open',
                null,
                mountOptions,
                keepKey
            );
            completeTrace('commit');
        };

        // open は遷移しない
        if (kind === 'open') {
            const gate = hasControlledHook('beforeOpen')
                ? runControlledHookMaybe('beforeOpen', {entryId: id, action: kind})
                : {ok: true};

            runMaybeAsync(gate, (g) => {
                if (!g || g.ok === false) {
                    cancelHandle('blocked', 'beforeOpen', undefined);
                    return;
                }

                doOpenCommit();
            });

            return handle;
        }

        /**
         * resolveUrlLocation - url を解決可能なRouteLocationRawへ変換します
         * @param rawUrl - url
         * @param base - 基準ルート
         * @returns 解決用のRouteLocationRaw
         */
        const resolveUrlLocation = (
            rawUrl: string | import('vue-router').RouteLocationRaw,
            base: import('vue-router').RouteLocationNormalizedLoaded
        ): import('vue-router').RouteLocationRaw => {
            if (typeof rawUrl === 'string') {
                return rawUrl;
            }

            if ('name' in rawUrl || 'path' in rawUrl) {
                return rawUrl;
            }

            return {
                path: base.path,
                query: rawUrl.query !== undefined ? rawUrl.query : base.query,
                hash: rawUrl.hash !== undefined ? rawUrl.hash : base.hash
            };
        };

        /** @type {import('vue-router').RouteLocationRaw|null} */
        let navigateTo = null;

        if (isRouteTarget(target)) {
            navigateTo = target;
        } else if (url !== undefined) {
            navigateTo = resolveUrlLocation(url, current);
        }

        // Component/loader で url が無ければ URL は動かさず commit する
        if (navigateTo === null) {
            traceStage = 'open';

            const gate = hasControlledHook('beforeOpen')
                ? runControlledHookMaybe('beforeOpen', {entryId: id, action: kind})
                : {ok: true};

            runMaybeAsync(gate, (g) => {
                if (!g || g.ok === false) {
                    cancelHandle('blocked', 'beforeOpen', undefined);
                    return;
                }

                captureBackgroundBeforeFirstPresenter();

                const actual = router.resolve(current.fullPath);
                commitEntry(
                    presenterName,
                    kind,
                    actual,
                    handle,
                    viewComponent,
                    'open',
                    null,
                    mountOptions,
                    undefined
                );
                completeTrace('commit');
            });

            return handle;
        }

        const allowUnmatched = !isRouteTarget(target) && typeof url === 'string';
        const resolved = router.resolve(navigateTo);
        assertValidRoute(resolved, allowUnmatched);

        if (resolved.fullPath === current.fullPath) {
            warnDev('push/replace() no-op: resolved fullPath is same as current (router-link behavior).', {
                kind: kind,
                fullPath: resolved.fullPath
            });

            cancelHandle('aborted', 'noOpSameFullPath', undefined);
            return handle;
        }

        const startNavigation = () => {
            captureBackgroundBeforeFirstPresenter();

            navigationToken += 1;
            const token = navigationToken;

            const pendingEntry: PendingWithTrace = {
                id: id,
                token: token,
                presenterName: presenterName,
                kind: kind,
                navType: kind,
                returnTo: kind === 'replace' ? current.fullPath : null,
                route: markRaw(resolved),
                allowUnmatched: allowUnmatched,
                handle: handle,
                viewComponent: viewComponent,

                // v4.0: dev-only trace
                traceId: traceId,
                traceSettled: false
            };

            $layerge.pending = pendingEntry;

            try {
                decisionTraceStore.push(traceId, 'applyRouter', {kind: kind});
            } catch {
                // ignore
            }

            /** @type {Promise<unknown>|unknown} */
            let p;

            try {
                p = kind === 'push' ? router.push(navigateTo) : router.replace(navigateTo);
            } catch (err) {
                const pending: PendingWithTrace | null = $layerge.pending;

                if (pending && pending.id === id && pending.token === token) {
                    $layerge.pending = null;

                    if ($layerge.stack.length === 0) {
                        $layerge.backgroundRoute = null;
                        $layerge.freezeBackground = false;
                    }
                }

                try {
                    decisionTraceStore.push(traceId, 'error', {
                        message: err instanceof Error ? err.message : String(err),
                        name: err instanceof Error ? err.name : 'unknown'
                    });
                } catch {
                    // ignore
                }

                cancelHandle('failed', 'routerNavigationFailed', err);
                return;
            }

            (handle as HandleWithNav)._navPromise = p;

            if (p && typeof (/** @type {any} */ p.catch) === 'function') {
                /** @type {any} */ p.catch((err) => {
                    const pending: PendingWithTrace | null = $layerge.pending;

                    if (pending && pending.id === id && pending.token === token) {
                        $layerge.pending = null;

                        if ($layerge.stack.length === 0) {
                            $layerge.backgroundRoute = null;
                            $layerge.freezeBackground = false;
                        }
                    }

                    try {
                        decisionTraceStore.push(traceId, 'error', {
                            message: err instanceof Error ? err.message : String(err),
                            name: err instanceof Error ? err.name : 'unknown'
                        });
                    } catch {
                        // ignore
                    }

                    cancelHandle('failed', 'routerNavigationFailed', err);
                });
            }
        };

        const gateOpen = hasControlledHook('beforeOpen')
            ? runControlledHookMaybe('beforeOpen', {entryId: id, action: kind})
            : {ok: true};

        runMaybeAsync(gateOpen, (gOpen) => {
            if (!gOpen || gOpen.ok === false) {
                cancelHandle('blocked', 'beforeOpen', undefined);
                return;
            }

            const gateNav = hasControlledHook('beforeNavigate')
                ? runControlledHookMaybe('beforeNavigate', {
                      entryId: id,
                      action: kind,
                      fromFullPath: current.fullPath,
                      toFullPath: resolved.fullPath
                  })
                : {ok: true};

            runMaybeAsync(gateNav, (gNav) => {
                if (!gNav || gNav.ok === false) {
                    cancelHandle('blocked', 'beforeNavigate', undefined);
                    return;
                }

                startNavigation();
            });
        });

        return handle;
    };

    /**
     * attachPresenterApi - router[presenterName] を生やします
     * @param presenterName - Presenter 名
     * @throws {Error} Presenter 名が router と衝突する場合にスロー
     * @returns
     */
    const attachPresenterApi = (presenterName: string): void => {
        const routerAsMap = router as unknown as Record<string, PresenterApi | undefined>;

        if (routerAsMap[presenterName] !== undefined) {
            throw new Error(`[Layerge] Presenter name conflicts with router property: ${presenterName}`);
        }

        routerAsMap[presenterName] = {
            push: (target, options) => {
                return presenterNavigate(presenterName, 'push', target, options);
            },
            pushAsync: async (target, options) => {
                const handle = presenterNavigate(presenterName, 'push', target, options);
                return await handle.settled;
            },
            replace: (target, options) => {
                return presenterNavigate(presenterName, 'replace', target, options);
            },
            open: (target, options) => {
                return presenterNavigate(presenterName, 'open', target, options);
            },
            closeAsync: async (entryId, options) => {
                if (typeof entryId !== 'string' || entryId.length === 0) {
                    warnDev('closeAsync() requires a valid entryId string.', {entryId: entryId});
                    return {status: 'aborted'};
                }

                return await closeByIdInternalAsync(entryId, options);
            }
        };
    };

    for (const name of Object.keys($layerge.presenters)) {
        attachPresenterApi(name);
    }

    /**
     * routeKey - 背景一致/stack一致の比較キー
     * @param r - ルート
     * @returns キー
     */
    const routeKey = (r: import('vue-router').RouteLocationNormalizedLoaded): string => {
        if (backgroundCompare === 'path') {
            return r.path;
        }

        return r.fullPath;
    };

    /**
     * findStackIndexByTo - stack 内で to と一致する最後の index を探します
     * @param to - 遷移先
     * @returns index（見つからなければ -1）
     */
    const findStackIndexByTo = (to: import('vue-router').RouteLocationNormalizedLoaded): number => {
        const key = routeKey(to);

        for (let i = $layerge.stack.length - 1; i >= 0; i--) {
            const entry = $layerge.stack[i];

            if (routeKey(entry.route) === key) {
                return i;
            }
        }

        return -1;
    };

    // afterEach 成功時のみ予約を commit する（state machine）
    router.afterEach((to, _from, failure) => {
        // If a stale navigation somehow reaches afterEach, ignore it.
        const staleAt = staleNavs.get(to.fullPath);

        if (staleAt !== undefined) {
            staleNavs.delete(to.fullPath);

            if (Date.now() - staleAt < STALE_NAV_TTL_MS) {
                return;
            }
        }

        // pending の commit が先（既存の処理）
        const pending: PendingWithTrace | null = $layerge.pending;

        if (pending) {
            // この afterEach が pending の遷移と一致しない場合は何もしない
            // （ガード遅延・連打・上書きで古い遷移が後から完了しても state を巻き戻さない）
            if (to.fullPath !== pending.route.fullPath) {
                return;
            }

            $layerge.pending = null;

            // failure/cancel は commit しない
            if (failure) {
                if ($layerge.stack.length === 0) {
                    $layerge.backgroundRoute = null;
                    $layerge.freezeBackground = false;
                }

                (pending.handle as PresenterHandleInternal)._setActive(false);
                (pending.handle as PresenterHandleInternal)._resolveClosed();

                if (pending.traceId && pending.traceSettled !== true) {
                    try {
                        decisionTraceStore.push(pending.traceId, 'settle', {
                            status: 'aborted',
                            reason: 'routerFailure'
                        });
                    } catch {
                        // ignore
                    }

                    const publicStatus = settleOutcomeInternal({
                        traceId: pending.traceId,
                        stage: 'navigate',
                        status: 'aborted',
                        reason: 'routerFailure'
                    });
                    pending.traceSettled = true;
                    (pending.handle as PresenterHandleInternal)._resolveSettled({
                        status: publicStatus.status
                    });
                }

                return;
            }

            const actual = router.resolve(to.fullPath);

            commitEntry(
                pending.presenterName,
                pending.kind,
                actual,
                pending.handle as PresenterHandleInternal,
                pending.viewComponent,
                pending.navType,
                pending.returnTo
            );

            if (pending.traceId && pending.traceSettled !== true) {
                try {
                    decisionTraceStore.push(pending.traceId, 'settle', {
                        status: 'completed',
                        reason: 'commit'
                    });
                } catch {
                    // ignore
                }

                settleOutcomeInternal({
                    traceId: pending.traceId,
                    stage: 'navigate',
                    status: 'completed',
                    reason: 'commit'
                });
                pending.traceSettled = true;
            }

            // v2.x: push で起動した Presenter は Forward で復元できるように、履歴へ状態を刻む
            // NOTE: replace/open は対象外（仕様）
            if (pending.kind === 'push') {
                historyPresenterRecords.set(pending.id, {
                    presenterName: pending.presenterName,
                    viewComponent: pending.viewComponent
                });

                mergeHistoryStateInternal({
                    layerge: {
                        mode: 'presenter',
                        entryId: pending.id,
                        toFullPath: actual.fullPath
                    }
                });
            }

            return;
        }

        // v2.x: Forward/Back による復元
        // - 現在の history entry が "Presenter である" と刻まれている場合は、Presenter モードへ復元する。
        // - ここで URL を動かさない（既に router が目的地へ復元済み）
        // NOTE: replace/open は履歴に刻まないため対象外。
        const layergeHistory = readLayergeHistoryStateInternal();

        if (
            layergeHistory &&
            layergeHistory.toFullPath === to.fullPath &&
            $layerge.mode === 'page' &&
            $layerge.stack.length === 0
        ) {
            const record = historyPresenterRecords.get(layergeHistory.entryId);

            if (record) {
                // 背景は vue-router の history.state.back を優先して固定する
                // - push 時は「遷移前に capture する」設計だが、Forward 復元時点では遷移後なので back から復元する
                try {
                    const h = typeof globalThis !== 'undefined' ? globalThis.history : undefined;
                    const backPath =
                        h &&
                        h.state &&
                        typeof h.state === 'object' &&
                        typeof (/** @type {any} */ h.state.back) === 'string'
                            ? /** @type {any} */ h.state.back
                            : null;

                    if (backPath) {
                        const bg = router.resolve(backPath);
                        $layerge.backgroundRoute = markRaw(bg);
                        $layerge.freezeBackground = true;
                    }
                } catch {
                    // ignore
                }

                const restoredHandle = buildHandle(layergeHistory.entryId);
                const actual = router.resolve(to.fullPath);

                const restoreTraceId = createId('trace');

                try {
                    decisionTraceStore.start(restoreTraceId);
                    decisionTraceStore.push(restoreTraceId, 'resolveTarget', {
                        action: 'restore',
                        entryId: layergeHistory.entryId,
                        presenterName: record.presenterName
                    });
                } catch {
                    // ignore
                }

                commitEntry(
                    record.presenterName,
                    'push',
                    actual,
                    restoredHandle,
                    record.viewComponent,
                    'push',
                    null
                );

                settleOutcomeInternal({
                    traceId: restoreTraceId,
                    stage: 'restore',
                    status: 'completed',
                    reason: 'forwardRestore'
                });

                return;
            }
        }

        // ★ Back で overlay だけ閉じたケース：
        // 目的地が背景なら、ここで freeze を解除する
        if ($layerge.mode === 'page' && $layerge.freezeBackground === true && $layerge.backgroundRoute) {
            if (isSameAsBackground(to)) {
                $layerge.backgroundRoute = null;
                $layerge.freezeBackground = false;
            }
        }

        // If we decided to exit presenter mode on this navigation, do it only when navigation succeeded.
        if (exitOnNextSuccess && exitTargetFullPath === to.fullPath) {
            exitOnNextSuccess = false;
            exitTargetFullPath = null;

            if (!failure) {
                exitPresenterMode();
            }
        }
    });

    /**
     * notifyEnterDoneInternal - enter 完了通知
     * - latest-wins 競合で遅延通知が来ても entryId で無害化する
     * @param entryId - 対象 entryId
     * @returns
     */
    const notifyEnterDoneInternal = (entryId: string): void => {
        const entry = $layerge.stack.find((x) => x.id === entryId);

        if (!entry) {
            return;
        }

        // leave に入っていたら触らない（競合を無害化）
        if (entry.phase === 'leave') {
            return;
        }

        entry.phase = 'active';
    };

    /**
     * notifyLeaveDoneInternal - leave 完了通知
     * - entryId 照合で競合を無害化する
     * @param entryId - 対象 entryId
     * @returns
     */
    const notifyLeaveDoneInternal = (entryId: string): void => {
        const index = $layerge.leaving.findIndex((x) => x.id === entryId);

        if (index < 0) {
            return;
        }

        const entry = $layerge.leaving[index];

        $layerge.leaving.splice(index, 1);

        // v2: entry が完全破棄されるタイミングで invoker も自動破棄する
        deleteInvokerInternal(entryId);

        // v3: keepMounted の場合は DOM を維持するために kept へ移動する
        if (entry && entry._keepMounted === true) {
            const kept = ensureKeptArray();

            entry.phase = 'active';
            entry._isHidden = true;

            // stack には残っていない前提。ここで kept に保持する。
            kept.push(entry);
        }

        // close 完了は leave 完了で resolve
        (entry.handle as PresenterHandleInternal)._resolveClosed();
    };

    /**
     * closeTopInternal - 一番上の Presenter を閉じます
     * @param [options] - オプション
     * @returns
     */
    const closeTopInternal = (options?: {restoreUrl?: boolean} | undefined): void => {
        const top = $layerge.stack[$layerge.stack.length - 1];

        if (!top) {
            return;
        }

        closeByIdInternal(top.id, options);
    };

    /**
     * closeAllInternal - 全 Presenter を閉じます
     * @param [options] - オプション
     * @returns
     */
    const closeAllInternal = (options?: {restoreUrl?: boolean} | undefined): void => {
        const restoreUrl = options && options.restoreUrl === false ? false : true;
        const backgroundFullPath = $layerge.backgroundRoute ? $layerge.backgroundRoute.fullPath : null;

        if ($layerge.stack.length > 0) {
            moveStackEntriesToLeaving(0);
        }

        exitPresenterMode();

        if (!restoreUrl) {
            return;
        }

        if (typeof backgroundFullPath === 'string' && backgroundFullPath.length > 0) {
            router.replace(backgroundFullPath);
        }
    };

    // Presenter 中に通常遷移が走ったら、前同期で exitPresenterMode（安全第一）
    router.beforeEach((to) => {
        // If this navigation is a stale one (superseded by latest-wins), cancel it.
        // This prevents a delayed guard from accidentally dropping presenter mode later.
        const staleAt = staleNavs.get(to.fullPath);

        if (staleAt !== undefined) {
            staleNavs.delete(to.fullPath);

            if (Date.now() - staleAt < STALE_NAV_TTL_MS) {
                return false;
            }
        }

        const isModalPending = !!$layerge.pending;

        if ($layerge.mode !== 'presenter') {
            return;
        }

        // modal.push/replace の遷移中は afterEach で commit
        if (isModalPending) {
            return;
        }

        // 1) 背景へ戻るなら overlayだけ消す（freezeは維持）
        if ($layerge.backgroundRoute && isSameAsBackground(to)) {
            clearPresenterOverlay();
            return;
        }

        // 2) stack 内のどこかへ戻る/進むなら、そこまで pop して整合させる
        const idx = findStackIndexByTo(to);

        if (idx >= 0) {
            // idx より上を close する（leave保持のため leaving へ移動）
            if ($layerge.stack.length - 1 > idx) {
                moveStackEntriesToLeaving(idx + 1);
            }

            // presenter を維持（多段 back でも page に落とさない）
            $layerge.mode = 'presenter';

            return;
        }

        // 3) どこにも一致しないなら、遷移が成功した場合のみ文脈破棄（安全第一）
        exitOnNextSuccess = true;
        exitTargetFullPath = to.fullPath;
    });

    $layerge._exitPresenterMode = exitPresenterMode;
    $layerge._closeTop = closeTopInternal;
    $layerge._closeAll = closeAllInternal;
    $layerge._closeById = closeByIdInternal;
    $layerge._notifyEnterDone = notifyEnterDoneInternal;
    $layerge._notifyLeaveDone = notifyLeaveDoneInternal;
    $layerge.stackEnabled = defaultStack;
    $layerge.cacheEnabled = defaultCache;

    (router as LayergeRouter<P>).$layerge = $layerge;
    (router as LayergeRouter<P>).exitPresenterMode = exitPresenterMode;
    (router as LayergeRouter<P>).getLayergeState = () => {
        return {mode: $layerge.mode, depth: $layerge.stack.length};
    };

    if (debug) {
        router.afterEach((to) => {
            console.debug('[Layerge][afterEach]', {
                to: to.fullPath,
                mode: $layerge.mode,
                depth: $layerge.stack.length
            });
        });
    }

    // v3.1: beforeunload（タブ閉じ/リロード）は Layerge コアでは扱わない
    // - leaveGuard 登録entryの dirty/pending を参照し、1つでも存在する場合のみ有効化
    if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
        /** @type {((e: BeforeUnloadEvent) => void)|null} */
        let handler: ((e: BeforeUnloadEvent) => void) | null = null;

        __layergeSubscribeBeforeUnload((needed) => {
            if (!needed) {
                if (handler) {
                    window.removeEventListener('beforeunload', handler);
                    handler = null;
                }
                return;
            }

            if (handler) {
                return;
            }

            handler = (e) => {
                // NOTE: ブラウザ仕様上、message はほぼ無視されます
                e.preventDefault();
                e.returnValue = '';
            };

            window.addEventListener('beforeunload', handler);
        });
    }

    // Vue Router の install(app) に紐づけて provide / component 登録を自動化する
    // - 利用者は app.use(router) だけで動く
    // - $layerge / LayergeKey の両provideを内部に閉じ込める（v1互換）
    if (typeof router.install === 'function') {
        const originalInstall = router.install.bind(router);

        router.install = (app) => {
            if (installedApps.has(app)) {
                return;
            }

            installedApps.add(app);

            originalInstall(app);

            app.provide('$layerge', (router as LayergeRouter<P>).$layerge);
            app.provide(LayergeKey, (router as LayergeRouter<P>).$layerge);
            app.component('LayergeView', LayergeView);
            app.component('LayergeTransition', LayergeTransition);
        };
    }

    // router 自体に Presenter API を生やして返す（同一インスタンス）
    return router as LayergeRouter<P>;
};

export {createLayergeRouter};
