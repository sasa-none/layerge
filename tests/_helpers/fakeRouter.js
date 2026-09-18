/**
 * createFakeRouter - createLayergeRouter のロジックテスト用の最小 Router
 * - DOM や Vue App を必要としない
 * - beforeEach / afterEach を登録できる
 * - push/replace/ナビゲーションを Promise で提供する
 *
 * @param {{initial?:string,delayMs?:(number|((to:any)=>number)),fail?:(boolean|((to:any)=>boolean))}} options
 * @returns {import('vue-router').Router&{_navigate:(to:any)=>Promise<void>,_getHookCounts:()=>{beforeEach:number,afterEach:number},_flushNavigation:()=>Promise<void>}}}
 */
const createFakeRouter = (options = {}) => {
    const beforeEachHooks = [];
    const afterEachHooks = [];

    let navSequence = 0;
    let latestSequence = 0;

    /** @type {Promise<void>} */
    let lastNavigation = Promise.resolve();

    /** @type {Promise<void>[]} */
    const allNavigations = [];

    const normalize = (raw) => {
        if (typeof raw === 'string') {
            const fullPath = raw;
            const path = fullPath.split('?')[0].split('#')[0];
            return {fullPath: fullPath, path: path, matched: [{}]};
        }

        // Minimal RouteLocationRaw support for unit tests
        // - fullPath is respected when present
        // - path + query + hash are composed when provided
        if (raw && typeof raw === 'object') {
            if (typeof raw.fullPath === 'string') {
                const fullPath = raw.fullPath;
                const path = fullPath.split('?')[0].split('#')[0];
                return {fullPath: fullPath, path: path, matched: [{}]};
            }

            const path = typeof raw.path === 'string' ? raw.path : '/';

            let queryString = '';
            if (raw.query && typeof raw.query === 'object') {
                const entries = Object.entries(raw.query)
                    .filter(([, v]) => v !== undefined)
                    .map(([k, v]) => [String(k), v === null ? '' : String(v)]);

                // stable output for tests
                entries.sort((a, b) => (a[0] > b[0] ? 1 : a[0] < b[0] ? -1 : 0));

                const params = [];
                for (const [k, v] of entries) {
                    params.push(`${encodeURIComponent(k)}=${encodeURIComponent(v)}`);
                }
                if (params.length > 0) {
                    queryString = `?${params.join('&')}`;
                }
            }

            let hash = '';
            if (typeof raw.hash === 'string' && raw.hash.length > 0) {
                hash = raw.hash.startsWith('#') ? raw.hash : `#${raw.hash}`;
            }

            const fullPath = `${path}${queryString}${hash}`;
            return {fullPath: fullPath, path: path, matched: [{}]};
        }

        const fullPath = String(raw);
        const path = fullPath.split('?')[0].split('#')[0];
        return {fullPath: fullPath, path: path, matched: [{}]};
    };

    /** @type {{value:any}} */
    const currentRoute = {value: normalize(options.initial ? options.initial : '/')};

    const resolve = (to) => {
        return normalize(to);
    };

    const runBeforeEach = async (to, from) => {
        for (const hook of beforeEachHooks) {
            await new Promise((resolveNext, rejectNext) => {
                /** @type {boolean} */
                let called = false;

                /**
                 * next - Vue Router の next と同形のコールバック（最小対応）
                 * - next(): 続行
                 * - next(false): そのナビゲーションを中止（aborted）
                 *
                 * @param {unknown} [result]
                 * @returns {void}
                 */
                const next = (result) => {
                    if (called) {
                        return;
                    }

                    called = true;

                    if (result === false) {
                        rejectNext({to: to, from: from, type: 'aborted'});
                        return;
                    }

                    resolveNext();
                };

                try {
                    // vue-router 4 以降のガードは値を return する形も取る。
                    // 実物と同じく、返り値が undefined 以外なら next(値) と同義に扱う。
                    const returned = hook(to, from, next);

                    if (returned !== undefined) {
                        next(returned);
                        return;
                    }

                    // next を呼ばず、値も返さないガードは「続行」とみなす
                    // （3 引数を宣言していないガードは next を受け取らない）
                    if (!called && hook.length < 3) {
                        next();
                    }
                } catch (e) {
                    rejectNext(e);
                }
            });
        }
    };

    const runAfterEach = async (to, from, failure) => {
        for (const hook of afterEachHooks) {
            hook(to, from, failure);
        }
    };

    const navigate = async (toRaw) => {
        const seq = ++navSequence;
        latestSequence = seq;

        const from = currentRoute.value;
        const to = resolve(toRaw);

        const delay = typeof options.delayMs === 'function' ? options.delayMs(toRaw) : options.delayMs || 0;
        const shouldFail = typeof options.fail === 'function' ? options.fail(toRaw) : options.fail === true;

        try {
            await runBeforeEach(to, from);
        } catch (e) {
            // next(false) で中止された場合も afterEach を呼ぶ（Vue Router 相当）
            if (e && typeof e === 'object' && e.type === 'aborted') {
                await runAfterEach(to, from, e);
            }

            throw e;
        }

        if (delay > 0) {
            await new Promise((r) => {
                setTimeout(r, delay);
            });
        }

        // 新しいナビゲーションが始まっていたら、この遷移はキャンセル扱いにする
        if (seq !== latestSequence) {
            const failure = {to: to, from: from, type: 'cancelled'};
            await runAfterEach(to, from, failure);
            throw failure;
        }

        if (shouldFail) {
            const failure = {to: to, from: from, type: 'aborted'};
            await runAfterEach(to, from, failure);
            throw failure;
        }

        currentRoute.value = to;

        await runAfterEach(to, from, undefined);
    };

    const push = (to) => {
        lastNavigation = navigate(to);
        allNavigations.push(lastNavigation);
        return lastNavigation;
    };

    const replace = (to) => {
        lastNavigation = navigate(to);
        allNavigations.push(lastNavigation);
        return lastNavigation;
    };

    const beforeEach = (hook) => {
        beforeEachHooks.push(hook);
        return () => {};
    };

    const afterEach = (hook) => {
        afterEachHooks.push(hook);
        return () => {};
    };

    // Router として必要な最低限の形だけ用意
    const router = {
        currentRoute: currentRoute,
        resolve: resolve,
        push: push,
        replace: replace,
        beforeEach: beforeEach,
        afterEach: afterEach,
        install: () => {},

        // テスト補助
        _navigate: (to) => {
            lastNavigation = navigate(to);
            return lastNavigation;
        },
        _flushNavigation: () => {
            return lastNavigation;
        },
        _flushAllNavigations: () => {
            return Promise.allSettled(allNavigations);
        },
        _getHookCounts: () => {
            return {beforeEach: beforeEachHooks.length, afterEach: afterEachHooks.length};
        }
    };

    return /** @type {any} */ (router);
};

export {createFakeRouter};
