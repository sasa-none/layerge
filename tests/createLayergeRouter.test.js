
import {describe, expect, it, vi} from 'vitest';
import {createLayergeRouter} from '../layerge/router/createLayergeRouter';
import {createFakeRouter} from './_helpers/fakeRouter';

describe('createLayergeRouter (v1)', () => {
    it('throws when cache:true & stack:false', () => {
        const router = createFakeRouter();

        expect(() => {
            createLayergeRouter({
                router: router,
                stack: false,
                cache: false,
                presenters: {
                    Modal: {
                        component: /** @type {any} */ ({}),
                        stack: false,
                        cache: true
                    }
                }
            });
        }).toThrow(/cache:true but stack:false/i);
    });

    it('supports display option (default + per presenter)', () => {
        const router = createFakeRouter();

        const wrapped = createLayergeRouter({
            router: router,
            display: 'stack+cache',
            presenters: {
                modal: {
                    component: /** @type {any} */ ({}),
                    display: 'top'
                }
            }
        });

        // defaults from display
        expect(wrapped.$layerge.stackEnabled).toBe(true);
        expect(wrapped.$layerge.cacheEnabled).toBe(true);

        // presenter override
        expect(wrapped.$layerge.presenters.modal.display).toBe('top');
        expect(wrapped.$layerge.presenters.modal.stack).toBe(false);
        expect(wrapped.$layerge.presenters.modal.cache).toBe(false);
    });

    it('throws on unknown display value', () => {
        const router = createFakeRouter();

        expect(() => {
            createLayergeRouter({
                router: router,
                presenters: {
                    modal: {
                        component: /** @type {any} */ ({}),
                        display: /** @type {any} */ ('unknown')
                    }
                }
            });
        }).toThrow(/unknown display/i);
    });

    it('wraps router.install and does not install twice for the same app', () => {
        const router = createFakeRouter();

        const installSpy = vi.fn();
        router.install = (app) => {
            installSpy(app);
        };

        const wrapped = createLayergeRouter({
            router: router,
            presenters: {}
        });

        const app = {
            provide: vi.fn(),
            component: vi.fn()
        };

        wrapped.install(app);
        wrapped.install(app);

        expect(installSpy).toHaveBeenCalledTimes(1);
        expect(app.provide).toHaveBeenCalledTimes(2); // '$layerge' と LayergeKey
        // v1.x: LayergeView + LayergeTransition を自動登録
        expect(app.component).toHaveBeenCalledTimes(2);
    });

    it('updates store depth on presenter push and back navigation', async () => {
        const router = createFakeRouter({initial: '/'});

        const wrapped = createLayergeRouter({
            router: router,
            presenters: {
                modal: {component: /** @type {any} */ ({})}
            },
            stack: true,
            cache: true
        });

        expect(wrapped.getLayergeState()).toEqual({mode: 'page', depth: 0});

        wrapped.modal.push('/a');
        await wrapped._flushNavigation();

        expect(wrapped.getLayergeState()).toEqual({mode: 'presenter', depth: 1});
        expect(wrapped.$layerge.freezeBackground).toBe(true);

        wrapped.modal.push('/b');
        await wrapped._flushNavigation();

        expect(wrapped.getLayergeState()).toEqual({mode: 'presenter', depth: 2});

        // back: /b -> /a
        await wrapped._navigate('/a');
        expect(wrapped.getLayergeState()).toEqual({mode: 'presenter', depth: 1});

        // back: /a -> /
        await wrapped._navigate('/');

        expect(wrapped.getLayergeState()).toEqual({mode: 'page', depth: 0});
        expect(wrapped.$layerge.freezeBackground).toBe(false);
        expect(wrapped.$layerge.backgroundRoute).toBe(null);
    });

    it('handle.close() is idempotent', async () => {
        const router = createFakeRouter({initial: '/'});

        const wrapped = createLayergeRouter({
            router: router,
            presenters: {
                modal: {component: /** @type {any} */ ({})}
            },
            stack: true,
            cache: false
        });

        const handle = wrapped.modal.push('/a');
        await wrapped._flushNavigation();

        expect(handle.isActive).toBe(true);
        expect(wrapped.getLayergeState().depth).toBe(1);

        const entryId = wrapped.$layerge.stack[0].id;

        handle.close();
        handle.close();
        handle.close();

        // close は即座にスタックから外す（leave は leaving に保持）
        expect(handle.isActive).toBe(false);
        expect(wrapped.getLayergeState()).toEqual({mode: 'page', depth: 0});
        expect(wrapped.$layerge.leaving.length).toBe(1);
        expect(wrapped.$layerge.leaving[0].id).toBe(entryId);

        // closed は leave 完了通知で resolve される（LayergeTransition が呼ぶ想定）
        wrapped.$layerge._notifyLeaveDone(entryId);
        await expect(handle.closed).resolves.toBeUndefined();
    });

    it('moves closed entries to leaving and resolves handle.closed on notifyLeaveDone', async () => {
        const router = createFakeRouter({initial: '/'});

        const wrapped = createLayergeRouter({
            router: router,
            presenters: {
                modal: {component: /** @type {any} */ ({})}
            },
            stack: true,
            cache: false
        });

        const handle = wrapped.modal.push('/a');
        await wrapped._flushNavigation();

        expect(wrapped.getLayergeState()).toEqual({mode: 'presenter', depth: 1});
        const entryId = wrapped.$layerge.stack[0].id;
        // v1.x: Transition を使わない場合、enter は自動で完了する（nextTick）
        // テストでは手動 notify も許容する。
        if (wrapped.$layerge.stack[0].phase === 'enter') {
            wrapped.$layerge._notifyEnterDone(entryId);
        }
        expect(['active', 'leave', 'enter']).toContain(wrapped.$layerge.stack[0].phase);

        // close moves to leaving but does not resolve closed yet
        handle.close();
        expect(wrapped.getLayergeState()).toEqual({mode: 'page', depth: 0});
        expect(wrapped.$layerge.leaving.length).toBe(1);
        expect(wrapped.$layerge.leaving[0].id).toBe(entryId);
        expect(wrapped.$layerge.leaving[0].phase).toBe('leave');

        let closedResolved = false;
        handle.closed.then(() => {
            closedResolved = true;
        });

        // v1.x: Transition を使わない場合、leave は自動で完了する（nextTick）
        await wrapped._flushAllNavigations();
        await expect(handle.closed).resolves.toBeUndefined();
        expect(wrapped.$layerge.leaving.length).toBe(0);

        // 手動 notify も安全（冪等）
        wrapped.$layerge._notifyLeaveDone(entryId);
    });

    it('supports loader target and url on push', async () => {
        const router = createFakeRouter({initial: '/'});

        const wrapped = createLayergeRouter({
            router: router,
            presenters: {
                modal: {component: /** @type {any} */ ({})}
            },
            stack: true,
            cache: false
        });

        wrapped.modal.push(() => Promise.resolve({default: /** @type {any} */ ({})}), {url: '/modal/a'});
        await wrapped._flushNavigation();

        expect(wrapped.getLayergeState()).toEqual({mode: 'presenter', depth: 1});
        expect(wrapped.$layerge.stack[0].route.fullPath).toBe('/modal/a');
        expect(wrapped.$layerge.stack[0].viewComponent).toBeTruthy();
        expect(router.currentRoute.value.fullPath).toBe('/modal/a');
    });

    

    it('supports url (RouteLocationRaw) on push (query/hash merge)', async () => {
        const router = createFakeRouter({initial: '/'});

        const wrapped = createLayergeRouter({
            router: router,
            presenters: {
                modal: {component: /** @type {any} */ ({})}
            },
            stack: true,
            cache: false
        });

        wrapped.modal.push(() => Promise.resolve({default: /** @type {any} */ ({})}), {
            url: {query: {u: '1'}, hash: '#h'}
        });
        await wrapped._flushNavigation();

        expect(wrapped.getLayergeState()).toEqual({mode: 'presenter', depth: 1});
        expect(router.currentRoute.value.fullPath).toBe('/?u=1#h');
        expect(wrapped.$layerge.stack[0].route.fullPath).toBe('/?u=1#h');
    });

    it('no-ops when url resolves to same fullPath (router-link behavior)', async () => {
        const router = createFakeRouter({initial: '/'});

        const wrapped = createLayergeRouter({
            router: router,
            presenters: {
                modal: {component: /** @type {any} */ ({})}
            },
            stack: true,
            cache: false
        });

        const handle = wrapped.modal.push(() => Promise.resolve({default: /** @type {any} */ ({})}), {url: '/'});
        await wrapped._flushNavigation();

        expect(wrapped.getLayergeState()).toEqual({mode: 'page', depth: 0});
        expect(wrapped.$layerge.stack.length).toBe(0);
        await expect(handle.closed).resolves.toBeUndefined();
    });
it('prevents stale commit when navigations race', async () => {
        vi.useFakeTimers();

        const router = createFakeRouter({
            initial: '/',
            delayMs: (to) => (to === '/a' ? 50 : 0)
        });

        const wrapped = createLayergeRouter({
            router: router,
            presenters: {
                modal: {component: /** @type {any} */ ({})}
            },
            stack: true,
            cache: true
        });

        wrapped.modal.push('/a');
        wrapped.modal.push('/b');

        // 最新の遷移（/b）が先に確定
        await wrapped._flushNavigation();
        expect(wrapped.$layerge.stack[0].route.fullPath).toBe('/b');

        // 遅い /a が後から完了（キャンセル扱い）しても、stack が巻き戻らない
        vi.advanceTimersByTime(60);
        await wrapped._flushAllNavigations();

        expect(wrapped.$layerge.stack[0].route.fullPath).toBe('/b');
        expect(router.currentRoute.value.fullPath).toBe('/b');

        vi.useRealTimers();
    });

    it('cancels a superseded pending navigation when it resumes after a delayed guard (staleNavs)', async () => {
        vi.useFakeTimers();

        // Simulate a user-land guard that delays and prevents Layerge's beforeEach from running yet.
        // In real vue-router, this can happen with async guards that `await` before calling next().
        const router = createFakeRouter({initial: '/'});

        router.beforeEach((to, _from, next) => {
            if (to.fullPath === '/a') {
                setTimeout(() => {
                    next();
                }, 50);
                return;
            }

            next();
        });

        const wrapped = createLayergeRouter({
            router: router,
            presenters: {
                modal: {component: /** @type {any} */ ({})}
            },
            stack: true,
            cache: true
        });

        // Start A (pending) but delay it in the first guard.
        wrapped.modal.push('/a');

        // Immediately start B: latest-wins. This should supersede A.
        wrapped.modal.push('/b');
        await wrapped._flushNavigation();

        expect(wrapped.getLayergeState()).toEqual({mode: 'presenter', depth: 1});
        expect(wrapped.$layerge.stack[0].route.fullPath).toBe('/b');
        expect(router.currentRoute.value.fullPath).toBe('/b');

        // When the delayed guard finally resumes A, Layerge should cancel it (staleNavs)
        // so it can't drop presenter mode or mutate state.
        vi.advanceTimersByTime(60);
        await wrapped._flushAllNavigations();

        expect(wrapped.getLayergeState()).toEqual({mode: 'presenter', depth: 1});
        expect(wrapped.$layerge.stack[0].route.fullPath).toBe('/b');
        expect(router.currentRoute.value.fullPath).toBe('/b');

        vi.useRealTimers();
    });

    it('does not commit on navigation failure', async () => {
        const router = createFakeRouter({
            initial: '/',
            fail: (to) => to === '/fail'
        });

        const wrapped = createLayergeRouter({
            router: router,
            presenters: {
                modal: {component: /** @type {any} */ ({})}
            },
            stack: true,
            cache: true
        });

        wrapped.modal.push('/fail');

        await expect(wrapped._flushNavigation()).rejects.toBeTruthy();

        expect(wrapped.getLayergeState()).toEqual({mode: 'page', depth: 0});
        expect(wrapped.$layerge.freezeBackground).toBe(false);
        expect(wrapped.$layerge.backgroundRoute).toBe(null);
        expect(router.currentRoute.value.fullPath).toBe('/');
    });


    it('controlledHooks: beforeOpen can cancel an open', async () => {
        const router = createFakeRouter();

        const wrapped = createLayergeRouter({
            router: router,
            presenters: {
                modal: {component: /** @type {any} */ ({})}
            },
            controlledHooks: {
                beforeOpen: () => false
            }
        });

        const handle = wrapped.modal.open(/** @type {any} */ ({}));

        // allow async hook pipeline to run
        await Promise.resolve();

        expect(handle.isActive).toBe(false);
        expect(wrapped.$layerge.stack.length).toBe(0);
        expect(wrapped.$layerge.freezeBackground).toBe(false);
        expect(wrapped.$layerge.backgroundRoute).toBe(null);
    });

    it('controlledHooks: beforeNavigate can cancel push navigation', async () => {
        const router = createFakeRouter();

        const wrapped = createLayergeRouter({
            router: router,
            presenters: {
                modal: {component: /** @type {any} */ ({})}
            },
            controlledHooks: {
                beforeNavigate: () => false
            }
        });

        const handle = wrapped.modal.push('/a');
        await router._flushAllNavigations();
        await Promise.resolve();

        expect(handle.isActive).toBe(false);
        expect(router.currentRoute.value.fullPath).toBe('/');
        expect(wrapped.$layerge.stack.length).toBe(0);
    });

    it('controlledHooks: beforeClose can cancel closeTop', async () => {
        const router = createFakeRouter();

        /** @type {string|null} */
        let openedId = null;

        const wrapped = createLayergeRouter({
            router: router,
            presenters: {
                modal: {component: /** @type {any} */ ({})}
            },
            controlledHooks: {
                beforeOpen: (ctx) => {
                    openedId = ctx.entryId;
                },
                beforeClose: (ctx) => {
                    return ctx.entryId === openedId ? false : true;
                }
            }
        });

        const handle = wrapped.modal.push('/a');
        await router._flushAllNavigations();

        expect(wrapped.$layerge.stack.length).toBe(1);

        // try closing (should be cancelled)
        handle.close();
        await Promise.resolve();

        expect(handle.isActive).toBe(true);
        expect(wrapped.$layerge.stack.length).toBe(1);
        expect(wrapped.$layerge.stack[0].route.fullPath).toBe('/a');
    });

    it('controlledHooks: latest-wins abort cancels superseded open attempt', async () => {
        const router = createFakeRouter();

        /** @type {any[]} */
        const signals = [];

        const wrapped = createLayergeRouter({
            router: router,
            presenters: {
                modal: {component: /** @type {any} */ ({})}
            },
            controlledHooks: {
                beforeOpen: async (ctx) => {
                    signals.push(ctx.signal);
                    // wait a little unless aborted
                    await new Promise((resolve) => setTimeout(resolve, 30));
                    return true;
                }
            }
        });

        wrapped.modal.open(/** @type {any} */ ({}));
        wrapped.modal.open(/** @type {any} */ ({}));

        await new Promise((r) => setTimeout(r, 60));

        expect(signals.length).toBe(2);
        expect(signals[0].aborted).toBe(true);
        expect(signals[1].aborted).toBe(false);

        // only the latest open should be committed
        expect(wrapped.$layerge.stack.length).toBe(1);
    });
});
