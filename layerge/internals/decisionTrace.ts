/**
 * DecisionTraceLevel - DecisionTrace の出力レベル
 */
export type DecisionTraceLevel = 'off' | 'on-failure' | 'on-unexpected' | 'verbose';

/**
 * DecisionTraceEventType - DecisionTrace のイベント種別（固定）
 */
export type DecisionTraceEventType =
    | 'start'
    | 'resolveTarget'
    | 'validate'
    | 'runHook'
    | 'applyRouter'
    | 'latestWins'
    | 'commitLeaving'
    | 'settle'
    | 'log'
    | 'error';

/**
 * DecisionTraceEvent - DecisionTrace の1イベント
 */
export interface DecisionTraceEvent {
    /** 種別 */
    type: DecisionTraceEventType;
    /** 記録時刻（epoch ms） */
    at: number;
    /** 付随情報（サニタイズ済み） */
    data?: object | undefined;
}

/**
 * DecisionTrace - traceId に紐づくイベント列
 */
export interface DecisionTrace {
    /** 操作単位のtraceId */
    traceId: string;
    /** イベント列 */
    events: DecisionTraceEvent[];
}

/**
 * DecisionTraceStore - DecisionTrace を保持するリングバッファ
 */
export interface DecisionTraceStore {
    /** trace を開始します */
    start: (traceId: string) => DecisionTrace | null;
    /** イベントを追加します */
    push: (traceId: string, type: DecisionTraceEventType, data?: object) => void;
    /** trace を確定します */
    settle: (traceId: string) => void;
    /** 直近の trace を取得します */
    getAll: () => DecisionTrace[];
}

/**
 * DecisionTraceStoreOptions - createDecisionTraceStore の引数
 */
export interface DecisionTraceStoreOptions {
    /** 開発環境か */
    isDev: boolean;
    /** 出力レベル */
    level: DecisionTraceLevel;
    /** trace 保持件数 */
    maxTraces?: number;
    /** 1 trace あたりのイベント上限 */
    maxEventsPerTrace?: number;
    /** 付随情報のサニタイズ */
    sanitize?: (data: object) => object;
}

/**
 * MAX_TRACES_DEFAULT - trace 保持件数の既定値
 * @constant
 */
const MAX_TRACES_DEFAULT = 50;

/**
 * MAX_EVENTS_PER_TRACE_DEFAULT - 1 trace あたりのイベント上限の既定値
 * @constant
 */
const MAX_EVENTS_PER_TRACE_DEFAULT = 100;

/**
 * VALID_EVENT_TYPES - イベント種別の固定リスト
 * @constant
 */
const VALID_EVENT_TYPES: DecisionTraceEventType[] = [
    'start',
    'resolveTarget',
    'validate',
    'runHook',
    'applyRouter',
    'latestWins',
    'commitLeaving',
    'settle',
    'log',
    'error'
];

/**
 * createDecisionTraceStore - DecisionTrace 用のリングバッファを作成します
 * @param options - options
 * @returns store
 */
const createDecisionTraceStore = (options: DecisionTraceStoreOptions): DecisionTraceStore => {
    const isDev = options.isDev === true;
    const level = options.level;

    const maxTraces = typeof options.maxTraces === 'number' ? options.maxTraces : MAX_TRACES_DEFAULT;
    const maxEventsPerTrace =
        typeof options.maxEventsPerTrace === 'number'
            ? options.maxEventsPerTrace
            : MAX_EVENTS_PER_TRACE_DEFAULT;

    const sanitize =
        typeof options.sanitize === 'function'
            ? options.sanitize
            : (data: object): object => {
                  return data;
              };

    const active = new Map<string, DecisionTrace>();

    const ring: DecisionTrace[] = [];

    /**
     * shouldCapture - 現在の設定で trace を収集するか
     * @returns capture
     */
    const shouldCapture = (): boolean => {
        if (!isDev) {
            return false;
        }

        if (level === 'off') {
            return false;
        }

        return true;
    };

    /**
     * isValidType - イベント種別が固定リストに含まれるか
     * @param type - type
     * @returns valid
     */
    const isValidType = (type: string): type is DecisionTraceEventType => {
        return (VALID_EVENT_TYPES as string[]).indexOf(type) !== -1;
    };

    /**
     * start - trace を開始します
     * @param traceId - traceId
     * @returns trace
     */
    const start = (traceId: string): DecisionTrace | null => {
        if (!shouldCapture()) {
            return null;
        }

        const trace: DecisionTrace = {
            traceId: traceId,
            events: []
        };

        active.set(traceId, trace);

        // start は必ず記録
        push(traceId, 'start');

        return trace;
    };

    /**
     * push - イベントを追加します
     * @param traceId - traceId
     * @param type - type
     * @param data - data
     */
    const push = (traceId: string, type: DecisionTraceEventType, data?: object): void => {
        const trace = active.get(traceId);

        if (!trace) {
            return;
        }

        if (!isValidType(type)) {
            return;
        }

        // 1 trace あたりのイベント数は上限を超えないようにリングで維持する。
        // - settle を含む後続イベントを落とさない（末尾を優先）
        // - start は可能な限り残す（ただし maxEventsPerTrace が小さすぎる場合は保証しない）
        if (typeof maxEventsPerTrace === 'number' && maxEventsPerTrace > 0) {
            while (trace.events.length >= maxEventsPerTrace) {
                if (trace.events.length <= 1) {
                    // これ以上保持できない（maxEventsPerTrace=1 等）
                    trace.events.shift();
                    break;
                }

                if (trace.events[0] && trace.events[0].type === 'start') {
                    // start をできるだけ残す
                    trace.events.splice(1, 1);
                } else {
                    trace.events.shift();
                }
            }
        }

        const payload = data && typeof data === 'object' ? sanitize(data) : undefined;

        trace.events.push({
            type: type,
            at: Date.now(),
            data: payload
        });
    };

    /**
     * settle - trace を確定します
     * @param traceId - traceId
     */
    const settle = (traceId: string): void => {
        const trace = active.get(traceId);
        if (!trace) {
            return;
        }

        // settle は必ず記録
        push(traceId, 'settle');

        active.delete(traceId);

        ring.push(trace);
        while (ring.length > maxTraces) {
            ring.shift();
        }
    };

    /**
     * getAll - 直近の trace を取得します
     * @returns traces
     */
    const getAll = (): DecisionTrace[] => {
        return ring.slice();
    };

    return {
        start: start,
        push: push,
        settle: settle,
        getAll: getAll
    };
};

export {createDecisionTraceStore, MAX_TRACES_DEFAULT, MAX_EVENTS_PER_TRACE_DEFAULT};
