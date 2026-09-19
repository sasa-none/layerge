import type {PresenterAsyncResult, PresenterHandleInternal} from '../types.js';

/**
 * createPresenterHandle - PresenterHandleInternalを生成します
 * @param id - Presenterエントリの一意識別子となる内部ID
 * @param onClose - Presenterのclose実行時に呼び出されるコールバック関数
 * @returns 生成されたPresenterハンドルオブジェクト
 */
const createPresenterHandle = (id: string, onClose: () => void): PresenterHandleInternal => {
    let active = true;

    let resultDone = false;

    let resultValue: PresenterAsyncResult | null = null;

    let resolveClosed: ((value: void | PromiseLike<void>) => void) | null = null;

    let resolveResult: ((value: PresenterAsyncResult) => void) | null = null;

    const closed = new Promise<void>((r) => {
        resolveClosed = r;
    });

    const result = new Promise<PresenterAsyncResult>((r) => {
        resolveResult = r;
    });

    /**
     * resolveResultOnce - result を一度だけ解決します
     * @param value - 結果
     */
    const resolveResultOnce = (value: PresenterAsyncResult): void => {
        if (resultDone) {
            return;
        }

        resultDone = true;
        resultValue = value;

        if (resolveResult) {
            const r = resolveResult;
            resolveResult = null;
            r(value);
        }
    };

    const handle: PresenterHandleInternal = {
        _id: id,
        _resolveResult: resolveResultOnce,
        _resolveClosed: () => {
            // resolveClosed関数が存在する場合のみ実行（重複実行防止）
            if (resolveClosed) {
                const r = resolveClosed;
                resolveClosed = null;
                r();
            }
        },
        _setActive: (v) => {
            active = v;
        },
        close: () => {
            // 既に非アクティブな場合は何もしない（冪等性保証）
            if (!active) {
                return;
            }

            // v1.x: close() は多重呼び出しされても安全であるべき
            // - 最初の close で isActive を false にする
            // - leaving の破棄は notifyLeaveDone で行う
            active = false;

            onClose();
        },
        get closed() {
            return closed;
        },
        get result() {
            if (resultDone && resultValue) {
                return Promise.resolve(resultValue);
            }

            return result;
        },
        get isActive() {
            return active;
        }
    };

    return handle;
};

export {createPresenterHandle};
