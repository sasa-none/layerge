/**
 * DecisionTraceLevel - DecisionTrace の出力レベル
 * @typedef {'off'|'on-failure'|'on-unexpected'|'verbose'} DecisionTraceLevel
 */

/**
 * DecisionTraceEventType - DecisionTrace のイベント種別（固定）
 * @typedef {'start'|'resolveTarget'|'validate'|'runHook'|'applyRouter'|'latestWins'|'commitLeaving'|'settle'|'log'|'error'} DecisionTraceEventType
 */

/**
 * DecisionTraceEvent - DecisionTrace の1イベント
 * @typedef {object} DecisionTraceEvent
 * @property {DecisionTraceEventType} type - 種別
 * @property {number} at - 記録時刻（epoch ms）
 * @property {object|undefined} [data] - 付随情報（サニタイズ済み）
 */

/**
 * DecisionTrace - traceId に紐づくイベント列
 * @typedef {object} DecisionTrace
 * @property {string} traceId - 操作単位のtraceId
 * @property {DecisionTraceEvent[]} events - イベント列
 */

/**
 * DecisionTraceStore - DecisionTrace を保持するリングバッファ
 * @typedef {object} DecisionTraceStore
 * @property {(traceId: string) => DecisionTrace|null} start - trace を開始します
 * @property {(traceId: string, type: DecisionTraceEventType, data?: object) => void} push - イベントを追加します
 * @property {(traceId: string) => void} settle - trace を確定します
 * @property {() => DecisionTrace[]} getAll - 直近の trace を取得します
 */

/**
 * MAX_TRACES_DEFAULT - trace 保持件数の既定値
 * @constant
 * @type {number}
 */
const MAX_TRACES_DEFAULT = 50;

/**
 * MAX_EVENTS_PER_TRACE_DEFAULT - 1 trace あたりのイベント上限の既定値
 * @constant
 * @type {number}
 */
const MAX_EVENTS_PER_TRACE_DEFAULT = 100;

/**
 * VALID_EVENT_TYPES - イベント種別の固定リスト
 * @constant
 * @type {DecisionTraceEventType[]}
 */
const VALID_EVENT_TYPES = [
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
 * @param {{isDev: boolean, level: DecisionTraceLevel, maxTraces?: number, maxEventsPerTrace?: number, sanitize?: (data: object) => object}} options - options
 * @returns {DecisionTraceStore} store
 */
const createDecisionTraceStore = (options) => {
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
            : (data) => {
                  return data;
              };

    /** @type {Map<string, DecisionTrace>} */
    const active = new Map();

    /** @type {DecisionTrace[]} */
    const ring = [];

    /**
     * shouldCapture - 現在の設定で trace を収集するか
     * @returns {boolean} capture
     */
    const shouldCapture = () => {
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
     * @param {string} type - type
     * @returns {type is DecisionTraceEventType} valid
     */
    const isValidType = (type) => {
        return VALID_EVENT_TYPES.indexOf(/** @type {any} */ (type)) !== -1;
    };

    /**
     * start - trace を開始します
     * @param {string} traceId - traceId
     * @returns {DecisionTrace|null} trace
     */
    const start = (traceId) => {
        if (!shouldCapture()) {
            return null;
        }

        const trace = {
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
     * @param {string} traceId - traceId
     * @param {DecisionTraceEventType} type - type
     * @param {object} [data] - data
     * @returns {void}
     */
    const push = (traceId, type, data) => {
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
     * @param {string} traceId - traceId
     * @returns {void}
     */
    const settle = (traceId) => {
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
     * @returns {DecisionTrace[]} traces
     */
    const getAll = () => {
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
