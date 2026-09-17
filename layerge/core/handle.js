/**
 * createPresenterHandle - PresenterHandleInternalを生成します
 * @param {string} id - Presenterエントリの一意識別子となる内部ID
 * @param {() => void} onClose - Presenterのclose実行時に呼び出されるコールバック関数
 * @returns {import('../types').PresenterHandleInternal} 生成されたPresenterハンドルオブジェクト
 */
const createPresenterHandle = (id, onClose) => {
    /** @type {boolean} */
    let active = true;

    /** @type {boolean} */
    let settledDone = false;

    /** @type {import('../types').PresenterAsyncResult|null} */
    let settledValue = null;

    /** @type {(() => void)|null} */
    let resolveClosed = null;

    /** @type {((value: import('../types').PresenterAsyncResult) => void)|null} */
    let resolveSettled = null;

    /** @type {Promise<void>} */
    const closed = new Promise((r) => {
        resolveClosed = r;
    });

    /** @type {Promise<import('../types').PresenterAsyncResult>} */
    const settled = new Promise((r) => {
        resolveSettled = r;
    });

    /**
     * resolveSettledOnce - settled を一度だけ解決します
     * @param {import('../types').PresenterAsyncResult} value - 結果
     * @returns {void}
     */
    const resolveSettledOnce = (value) => {
        if (settledDone) {
            return;
        }

        settledDone = true;
        settledValue = value;

        if (resolveSettled) {
            const r = resolveSettled;
            resolveSettled = null;
            r(value);
        }
    };

    /** @type {import('../types').PresenterHandleInternal} */
    const handle = {
        _id: id,
        _resolveSettled: resolveSettledOnce,
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
        get settled() {
            if (settledDone && settledValue) {
                return Promise.resolve(settledValue);
            }

            return settled;
        },
        get isActive() {
            return active;
        }
    };

    return handle;
};

export {createPresenterHandle};
