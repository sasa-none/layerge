<template>
    <div class="HomeRoot">
        <h1 class="Title">Layerge Demo</h1>

        <div class="State">
            <div>
                mode:
                <code data-testid="home-mode">{{ mode }}</code>
            </div>
            <div>
                depth:
                <code data-testid="home-depth">{{ depth }}</code>
            </div>
            <div>
                url:
                <code data-testid="home-url">{{ currentUrl }}</code>
            </div>
            <div>home mounts: {{ mountCount }}</div>
            <div v-if="lastAction">
                last action:
                <code data-testid="last-action">{{ lastAction }}</code>
            </div>
            <div v-if="lastResult">
                last result:
                <code data-testid="last-result">{{ lastResult }}</code>
            </div>
        </div>

        <div class="Section">
            <h2 class="SubTitle">Demo pages</h2>
            <p class="Help">Each page below demonstrates one part of Layerge.</p>
            <ul class="Toc">
                <li class="TocItem">
                    <RouterLink to="/links" data-testid="toc-links">/links</RouterLink>
                    — LayergeLink and useLayergeLink: RouterLink-compatible ways to open a presenter.
                </li>
                <li class="TocItem">
                    <RouterLink to="/advanced" data-testid="toc-advanced">/advanced</RouterLink>
                    — controlledHooks and usePresenterLeaveGuard: cancelling and guarding operations.
                </li>
                <li class="TocItem">
                    <RouterLink to="/transition" data-testid="toc-transition">/transition</RouterLink>
                    — headless LayergeView, EntryContext, leaving retention and LayergeTransition.
                </li>
                <li class="TocItem">
                    <RouterLink to="/cache-state" data-testid="toc-cache-state">/cache-state</RouterLink>
                    — StackCard cache: component state is kept while another page is pushed on top.
                </li>
                <li class="TocItem">
                    <RouterLink to="/modal/url-overlay" data-testid="toc-url-overlay">
                        /modal/url-overlay
                    </RouterLink>
                    — bridge route: a deep link that re-opens an overlay and lands on Home when closed.
                </li>
                <li class="TocItem">
                    <RouterLink to="/modal/cache-demo" data-testid="toc-cache-demo">
                        /modal/cache-demo
                    </RouterLink>
                    — bridge route: a deep link that opens StackCard on a stateful page.
                </li>
            </ul>
        </div>

        <div class="Section">
            <h2 class="SubTitle">Navigate (page mode)</h2>
            <div class="Buttons">
                <button type="button" class="Btn" data-testid="nav-to-page-a" @click="navToPageA">
                    router.push('/page-a')
                </button>

                <RouterLink class="BtnLink" to="/links" data-testid="nav-to-links">
                    links demo (LayergeLink / useLayergeLink)
                </RouterLink>

                <RouterLink class="BtnLink" to="/advanced" data-testid="nav-to-advanced">
                    advanced demo (controlledHooks / leaveGuard)
                </RouterLink>
            </div>
        </div>

        <div class="Section">
            <h2 class="SubTitle">Modal (overlay)</h2>
            <div class="Buttons">
                <button type="button" class="Btn" data-testid="modal-push" @click="openModalA">
                    modal.push('/page-a')
                </button>
                <button type="button" class="Btn" data-testid="modal-open-current" @click="openModalAOpen">
                    modal.open(current)
                </button>
                <button
                    type="button"
                    class="Btn"
                    data-testid="modal-open-component"
                    @click="openModalComponent"
                >
                    modal.open(Component)
                </button>
                <button
                    type="button"
                    class="Btn"
                    data-testid="modal-open-component-no-transition"
                    @click="openModalComponentNoTransition"
                >
                    modalNoTransition.open(Component)
                </button>
                <button type="button" class="Btn" data-testid="modal-open-mixed" @click="openMixedStack">
                    modal.open(MixedStackDemo)
                </button>
                <button
                    type="button"
                    class="Btn"
                    data-testid="modal-replace-component"
                    @click="replaceModalComponent"
                >
                    modal.replace(Component, {url:'/no-route/replace'})
                </button>
                <button
                    type="button"
                    class="Btn"
                    data-testid="modal-open-mismatch"
                    @click="openModalMismatch"
                >
                    modal.open('/page-a') (view-only, URL unchanged)
                </button>
            </div>
        </div>

        <div class="Section">
            <h2 class="SubTitle">Modal (component / loader + url)</h2>
            <div class="Buttons">
                <button type="button" class="Btn" data-testid="modal-url" @click="openUrlComponent">
                    modal.push(Component, {url})
                </button>
                <button type="button" class="Btn" data-testid="modal-url-loader" @click="openUrlLoader">
                    modal.push(loader, {url})
                </button>
                <button
                    type="button"
                    class="Btn"
                    data-testid="modal-url-loader-slow"
                    @click="openUrlLoaderSlow"
                >
                    modal.push(slowLoader, {url})
                </button>
                <button
                    type="button"
                    class="Btn"
                    data-testid="modal-url-loader-fail"
                    @click="openUrlLoaderFail"
                >
                    modal.push(failingLoader, {url})
                </button>
            </div>
        </div>

        <div class="Section">
            <h2 class="SubTitle">Modal (component + url)</h2>
            <div class="Buttons">
                <button
                    type="button"
                    class="Btn"
                    data-testid="modal-url-query-hash"
                    @click="openUrlQueryHash"
                >
                    modal.push(Component, {url:{query,hash}})
                </button>
                <button type="button" class="Btn" data-testid="modal-url-noop" @click="openUrlNoop">
                    modal.push(Component, {url: current}) // no-op
                </button>
            </div>
        </div>

        <div class="Section">
            <h2 class="SubTitle">Async (guard delay / rapid click)</h2>
            <p class="Help">
                In this demo router, you can add
                <code>?delay=1200</code>
                to simulate a slow guard. Layerge should keep the latest operation consistent.
            </p>
            <div class="Buttons">
                <button type="button" class="Btn" data-testid="modal-race-ab" @click="raceAThenB">
                    race: modal.push('/page-a?delay=1200') → modal.push('/page-b')
                </button>
                <button type="button" class="Btn" data-testid="modal-race-ba" @click="raceBThenA">
                    race: modal.push('/page-b?delay=1200') → modal.push('/page-a')
                </button>
                <button
                    type="button"
                    class="Btn"
                    data-testid="modal-replace-race-ab"
                    @click="replaceRaceAThenB"
                >
                    race: modal.replace('/page-a?delay=1200') → modal.replace('/page-b')
                </button>
                <button
                    type="button"
                    class="Btn"
                    data-testid="modal-replace-race-ba"
                    @click="replaceRaceBThenA"
                >
                    race: modal.replace('/page-b?delay=1200') → modal.replace('/page-a')
                </button>
            </div>
            <div v-if="lastAction" class="LastAction">(see top panel)</div>
            <div v-if="lastResult" class="LastResult">(see top panel)</div>
        </div>

        <div class="Section">
            <h2 class="SubTitle">Failure (cancel / reject)</h2>
            <p class="Help">
                You can add
                <code>?cancel=1</code>
                to simulate a guard cancellation. In that case, navigation should be aborted and Layerge
                should not commit stale state. Also, when a pending navigation is superseded by a newer one,
                the first navigation becomes
                <code>cancelled</code>
                .
            </p>
            <div class="Buttons">
                <button type="button" class="Btn" data-testid="modal-cancel" @click="cancelModal">
                    modal.push('/page-a?cancel=1') (should cancel)
                </button>
                <button
                    type="button"
                    class="Btn"
                    data-testid="modal-cancel-delayed"
                    @click="cancelModalDelayed"
                >
                    modal.push('/page-a?delay=1200&cancel=1') (delayed cancel)
                </button>

                <button
                    type="button"
                    class="Btn"
                    data-testid="modal-cancelled-by-newer"
                    @click="cancelledByNewer"
                >
                    modal.push('/page-a?delay=1200') then modal.push('/page-b') (first should be cancelled)
                </button>
            </div>
        </div>

        <div class="Section">
            <h2 class="SubTitle">Close vs pending (recovery patterns)</h2>
            <p class="Help">
                These buttons demonstrate that closing the presenter wins even if a pending navigation or
                loader resolves later. The presenter should not re-open or fall back to page mode.
            </p>
            <div class="Buttons">
                <button
                    type="button"
                    class="Btn"
                    data-testid="closeall-vs-delayed"
                    @click="closeAllVsDelayedNav"
                >
                    modal.push('/page-a?delay=1200') then closeAll (stay closed)
                </button>
                <button
                    type="button"
                    class="Btn"
                    data-testid="closetop-vs-slowloader"
                    @click="closeTopVsSlowLoader"
                >
                    modal.push(slowLoader) then closeTop (stay closed)
                </button>
            </div>
        </div>

        <div class="Section">
            <h2 class="SubTitle">Deep links (bridge routes)</h2>
            <p class="Help">
                A url that points to a path with no matching route is allowed to 404 on refresh unless you
                provide a catch-all or a bridge route. The following routes are "entry points" that re-open a
                presenter on mount.
            </p>
            <div class="Routes">
                <RouterLink to="/modal/url-overlay" data-testid="route-bridge-url-overlay">
                    /modal/url-overlay
                </RouterLink>
                <RouterLink to="/modal/cache-demo" data-testid="route-bridge-cache-demo">
                    /modal/cache-demo
                </RouterLink>
            </div>
        </div>

        <div class="Section">
            <h2 class="SubTitle">StackCard (stack + cache)</h2>
            <div class="Buttons">
                <button type="button" class="Btn" @click="pushNext">push next</button>
                <button
                    type="button"
                    class="Btn"
                    data-testid="stackcard-no-transition-push-next"
                    @click="pushNextNoTransition"
                >
                    push next (no transition)
                </button>
                <button type="button" class="Btn" @click="pushAllNaive">push A→E (naive)</button>
                <button type="button" class="Btn" @click="pushAllSequential">push A→E (sequential)</button>
                <button type="button" class="Btn" @click="goBack">back</button>
            </div>
            <p class="Help">
                naive: rapid pushes are latest-wins, so only the last one commits.
                <br />
                sequential: waiting for each push to commit before the next one grows the stack.
            </p>
        </div>

        <div class="Section">
            <h2 class="SubTitle">Close</h2>
            <div class="Buttons">
                <button type="button" class="Btn" data-testid="close-top" @click="closeTop">closeTop</button>
                <button type="button" class="Btn" data-testid="close-all" @click="closeAll">closeAll</button>
                <button type="button" class="Btn" data-testid="exit-presenter" @click="exit">
                    exitPresenterMode
                </button>
            </div>
        </div>

        <div class="Section">
            <h2 class="SubTitle">Routes</h2>
            <div class="Routes">
                <RouterLink to="/">/</RouterLink>
                <RouterLink to="/page-a">/page-a</RouterLink>
                <RouterLink to="/page-b">/page-b</RouterLink>
                <RouterLink to="/page-c">/page-c</RouterLink>
                <RouterLink to="/page-d">/page-d</RouterLink>
                <RouterLink to="/page-e">/page-e</RouterLink>
                <RouterLink to="/cache-state">/cache-state</RouterLink>
                <RouterLink to="/transition">/transition (transition demo)</RouterLink>
                <RouterLink to="/no-route/help">/no-route/help (direct)</RouterLink>
            </div>
        </div>
    </div>
</template>

<script setup>
import {computed, onMounted, ref} from 'vue';
import {RouterLink, useRoute, useRouter} from 'vue-router';
import OpenContent from '../components/OpenContent.vue';
import ModalOpenContent from '../components/ModalOpenContent.vue';
import MixedOpenRoot from '../presenters/MixedOpenRoot.vue';
import {useLayerge} from 'layerge';
import {lastAction, lastResult, trackNavigation} from '../navLog';

import UrlOverlayContent from '../presenters/UrlOverlayContent.vue';

const router = useRouter();
const route = useRoute();
const layerge = useLayerge();

const mountCount = ref(0);

onMounted(() => {
    mountCount.value = mountCount.value + 1;
});

const mode = computed(() => {
    return layerge.mode;
});

const depth = computed(() => {
    return layerge.depth;
});

const currentUrl = computed(() => {
    return route.fullPath;
});

/**
 * trackTo
 * @param {string} action - 実行するアクション名
 * @param {import('vue-router').RouteLocationRaw} toRaw - 遷移先のルートロケーション
 * @param {{
 *     updateUi?: boolean,
 *     logOnly?: boolean,
 *     expectSuperseded?: boolean
 * }} [options] - トラッキング用のオプション設定
 * @returns {void}
 */
const trackTo = (action, toRaw, options = {}) => {
    const resolved = router.resolve(toRaw);
    trackNavigation(action, resolved.fullPath, options);
};

/**
 * setAction
 * @param {string} label - 設定するアクションラベル名
 * @returns {void}
 */
const setAction = (label) => {
    lastAction.value = label;
    lastResult.value = '';
};

const openModalA = () => {
    setAction("modal.push('/page-a')");
    trackTo("modal.push('/page-a')", '/page-a');
    router.modal.push('/page-a');
};

const openModalAOpen = () => {
    setAction("modal.open('/')");

    // open(RouteLocationRaw) is view-only and keeps the current URL.
    router.modal.open(route.fullPath);
};

const openModalComponent = () => {
    setAction('modal.open(Component)');
    try {
        router.modal.open(OpenContent);
        // open() does not navigate, so we update UI manually.
        lastResult.value = 'opened (no navigation)';
    } catch (e) {
        lastResult.value = `threw: ${e?.message ? e.message : String(e)}`;
        console.warn('[demo] open(Component) threw', e);
    }
};

const openModalComponentNoTransition = () => {
    setAction('modalNoTransition.open(Component)');

    try {
        router.modalNoTransition.open(OpenContent);
        // open() does not navigate, so we update UI manually.
        lastResult.value = 'opened (no navigation)';
    } catch (e) {
        lastResult.value = `threw: ${e?.message ? e.message : String(e)}`;
        console.warn('[demo] modalNoTransition.open(Component) threw', e);
    }
};

const openMixedStack = () => {
    setAction('modal.open(MixedStackDemo)');

    try {
        router.modal.open(MixedOpenRoot);
        lastResult.value = 'opened (no navigation)';
    } catch (e) {
        lastResult.value = `threw: ${e?.message ? e.message : String(e)}`;
        console.warn('[demo] open(MixedStackDemo) threw', e);
    }
};

const replaceModalComponent = () => {
    setAction("modal.replace(Component, {url:'/no-route/replace'})");
    trackTo("modal.replace(Component, {url:'/no-route/replace'})", '/no-route/replace');
    router.modal.replace(ModalOpenContent, {url: '/no-route/replace'});
};

const openModalMismatch = () => {
    setAction("modal.open('/page-a')");

    try {
        // open(RouteLocationRaw) is view-only: it does not navigate and keeps the current URL.
        // It can render a different route (with a warning in dev).
        router.modal.open('/page-a');
        lastResult.value = 'opened RouteLocationRaw (view-only, URL unchanged)';
    } catch (e) {
        lastResult.value = `threw: ${e?.message ? e.message : String(e)}`;
        console.warn('[demo] open(RouteLocationRaw) threw', e);
    }
};

const navToPageA = () => {
    router.push('/page-a');
};

const openUrlComponent = () => {
    setAction("modal.push(Component, {url:'/no-route/help'})");
    trackTo("modal.push(Component, {url:'/no-route/help'})", '/no-route/help');
    router.modal.push(UrlOverlayContent, {url: '/no-route/help'});
};

const openUrlLoader = () => {
    setAction("modal.push(loader, {url:'/no-route/help-async'})");
    trackTo("modal.push(loader, {url:'/no-route/help-async'})", '/no-route/help-async');

    const loader = () => {
        return import('../presenters/UrlOverlayContent.vue');
    };

    router.modal.push(loader, {url: '/no-route/help-async'});
};

const openUrlLoaderSlow = () => {
    setAction("modal.push(slowLoader, {url:'/no-route/help-slow'})");
    trackTo("modal.push(slowLoader, {url:'/no-route/help-slow'})", '/no-route/help-slow');

    const slowLoader = () => {
        return new Promise((resolve) => {
            window.setTimeout(() => {
                resolve(import('../presenters/UrlOverlayContent.vue'));
            }, 1200);
        });
    };

    router.modal.push(slowLoader, {url: '/no-route/help-slow'});
};

const openUrlLoaderFail = () => {
    setAction("modal.push(failingLoader, {url:'/no-route/help-fail'})");
    trackTo("modal.push(failingLoader, {url:'/no-route/help-fail'})", '/no-route/help-fail');

    const failingLoader = () => {
        return new Promise((_resolve, reject) => {
            window.setTimeout(() => {
                reject(new Error('Intentional loader failure for demo.'));
            }, 200);
        });
    };

    router.modal.push(failingLoader, {url: '/no-route/help-fail'});
};

const openUrlQueryHash = () => {
    setAction("modal.push(Component, {url:{query:{u:'1'},hash:'#h'}})");
    trackTo("modal.push(Component, {url:{query:{u:'1'},hash:'#h'}})", {
        path: '/',
        query: {u: '1'},
        hash: '#h'
    });
    router.modal.push(UrlOverlayContent, {url: {query: {u: '1'}, hash: '#h'}});
};

const openUrlNoop = () => {
    setAction('modal.push(Component, {url: current}) // no-op');
    // current fullPath を明示して指定（router-link準拠で no-op になる想定）
    const current = router.currentRoute.value.fullPath;
    trackTo('modal.push(Component, {url: current}) // no-op', current);
    router.modal.push(UrlOverlayContent, {url: current});
};

const raceAThenB = () => {
    lastAction.value = 'A(delay) → B';
    lastResult.value = '';

    // A will likely be superseded; keep it console-only.
    trackTo(
        "modal.push('/page-a?delay=1200')",
        {path: '/page-a', query: {delay: '1200'}},
        {updateUi: false, logOnly: true}
    );
    router.modal.push({path: '/page-a', query: {delay: '1200'}});

    // B is the final expected navigation.
    trackTo("modal.push('/page-b')", '/page-b');
    router.modal.push('/page-b');
};

const raceBThenA = () => {
    lastAction.value = 'B(delay) → A';
    lastResult.value = '';

    trackTo(
        "modal.push('/page-b?delay=1200')",
        {path: '/page-b', query: {delay: '1200'}},
        {updateUi: false, logOnly: true}
    );
    router.modal.push({path: '/page-b', query: {delay: '1200'}});

    trackTo("modal.push('/page-a')", '/page-a');
    router.modal.push('/page-a');
};

const replaceRaceAThenB = () => {
    lastAction.value = 'A(delay) → B (replace)';
    lastResult.value = '';

    trackTo(
        "modal.replace('/page-a?delay=1200')",
        {path: '/page-a', query: {delay: '1200'}},
        {updateUi: false, logOnly: true}
    );
    router.modal.replace({path: '/page-a', query: {delay: '1200'}});

    trackTo("modal.replace('/page-b')", '/page-b');
    router.modal.replace('/page-b');
};

const replaceRaceBThenA = () => {
    lastAction.value = 'B(delay) → A (replace)';
    lastResult.value = '';

    trackTo(
        "modal.replace('/page-b?delay=1200')",
        {path: '/page-b', query: {delay: '1200'}},
        {updateUi: false, logOnly: true}
    );
    router.modal.replace({path: '/page-b', query: {delay: '1200'}});

    trackTo("modal.replace('/page-a')", '/page-a');
    router.modal.replace('/page-a');
};

const cancelModal = () => {
    lastAction.value = 'cancel: A';
    lastResult.value = '';

    trackTo("modal.push('/page-a?cancel=1')", {path: '/page-a', query: {cancel: '1'}});
    router.modal.push({path: '/page-a', query: {cancel: '1'}});
};

const cancelModalDelayed = () => {
    lastAction.value = 'cancel(delay): A';
    lastResult.value = '';

    trackTo("modal.push('/page-a?delay=1200&cancel=1')", {
        path: '/page-a',
        query: {delay: '1200', cancel: '1'}
    });
    router.modal.push({path: '/page-a', query: {delay: '1200', cancel: '1'}});
};

const cancelledByNewer = () => {
    lastAction.value = 'cancelled: A(delay) → B';
    lastResult.value = '';

    // Track A as "superseded" for demo clarity.
    trackTo(
        "modal.push('/page-a?delay=1200')",
        {path: '/page-a', query: {delay: '1200'}},
        {expectSuperseded: true}
    );
    router.modal.push({path: '/page-a', query: {delay: '1200'}});

    // B should win and remain visible in Presenter mode.
    window.setTimeout(() => {
        trackTo("modal.push('/page-b')", '/page-b', {updateUi: false, logOnly: true});
        router.modal.push('/page-b');
    }, 50);
};

const closeAllVsDelayedNav = () => {
    lastAction.value = 'closeAll vs delayed nav';
    lastResult.value = '';

    // Start a delayed navigation.
    trackTo(
        "modal.push('/page-a?delay=1200')",
        {path: '/page-a', query: {delay: '1200'}},
        {updateUi: false, logOnly: true}
    );
    router.modal.push({path: '/page-a', query: {delay: '1200'}});

    // Close the presenter before the guard resolves.
    window.setTimeout(() => {
        layerge.closeAll();
        trackTo('layerge.closeAll()', route.fullPath, {updateUi: false, logOnly: true});

        // IMPORTANT:
        // `closeAll()` does not cancel an in-flight vue-router navigation.
        // To ensure the pending navigation does not "win later", we trigger a no-op `replace()`
        // (different query) to supersede the in-flight navigation, and immediately replace back.
        const cancelKey = String(Date.now());
        const basePath = route.path;
        const baseQuery = {...route.query};

        router
            .replace({path: basePath, query: {...baseQuery, __layerge_cancel: cancelKey}})
            .then(() => router.replace({path: basePath, query: baseQuery}))
            .catch((e) => {
                // ignore (demo only)
                console.warn('[demo] failed to supersede pending navigation', e);
            });
    }, 100);
};

const closeTopVsSlowLoader = () => {
    lastAction.value = 'closeTop vs slow loader';
    lastResult.value = '';

    const slowLoader = () => {
        return new Promise((resolve) => {
            window.setTimeout(() => {
                resolve(import('../presenters/UrlOverlayContent.vue'));
            }, 1200);
        });
    };

    trackTo("modal.push(slowLoader, {url:'/no-route/help-slow-close'})", '/no-route/help-slow-close');
    router.modal.push(slowLoader, {url: '/no-route/help-slow-close'});

    // Close quickly while loader is still pending.
    window.setTimeout(() => {
        layerge.closeTop();
        trackTo('layerge.closeTop()', route.fullPath, {updateUi: false, logOnly: true});
    }, 100);
};

const pushNext = () => {
    const order = ['/page-a', '/page-b', '/page-c', '/page-d', '/page-e'];

    const index = Math.max(0, Math.min(order.length - 1, layerge.depth));
    const next = order[index];

    trackTo(`stackCard.push('${next}')`, next);
    router.stackCard.push(next);
};

const pushNextNoTransition = () => {
    const order = ['/page-a', '/page-b', '/page-c', '/page-d', '/page-e'];

    const index = Math.max(0, Math.min(order.length - 1, layerge.depth));
    const next = order[index];

    trackTo(`stackCardNoTransition.push('${next}')`, next);
    router.stackCardNoTransition.push(next);
};

const pushAllNaive = () => {
    lastAction.value = 'push A→E (naive: last wins)';
    lastResult.value = '';

    const pages = ['/page-a', '/page-b', '/page-c', '/page-d', '/page-e'];

    for (const p of pages) {
        trackTo(`stackCard.push('${p}')`, p, {updateUi: false, logOnly: true});
        router.stackCard.push(p);
    }
};

const waitForDepth = (expected, timeoutMs) => {
    return new Promise((resolve, reject) => {
        const start = Date.now();

        const tick = () => {
            if (layerge.depth === expected) {
                resolve(true);
                return;
            }

            if (Date.now() - start > timeoutMs) {
                reject(new Error(`timeout waiting for depth=${expected}`));
                return;
            }

            window.setTimeout(tick, 50);
        };

        tick();
    });
};

const pushAllSequential = async () => {
    lastAction.value = 'push A→E (sequential)';
    lastResult.value = '';

    const pages = ['/page-a', '/page-b', '/page-c', '/page-d', '/page-e'];
    const baseDepth = layerge.depth;

    for (let i = 0; i < pages.length; i = i + 1) {
        const p = pages[i];

        trackTo(`stackCard.push('${p}')`, p, {updateUi: false, logOnly: true});
        router.stackCard.push(p);

        await waitForDepth(baseDepth + i + 1, 5000);
    }

    trackTo("stackCard.push('...') (sequential done)", route.fullPath, {updateUi: false, logOnly: true});
};

const goBack = () => {
    router.back();
};

const closeTop = () => {
    layerge.closeTop();
};

const closeAll = () => {
    layerge.closeAll();
};

const exit = () => {
    layerge.exit();
};
</script>

<style scoped>
.HomeRoot {
    padding: 16px;
    font-family:
        system-ui,
        -apple-system,
        'Segoe UI',
        Roboto,
        sans-serif;
}

.Title {
    margin: 0 0 12px;
    font-size: 20px;
}

.SubTitle {
    margin: 0 0 8px;
    font-size: 14px;
}

.State {
    display: grid;
    gap: 4px;
    padding: 12px;
    border: 1px solid #ddd;
    border-radius: 8px;
}

.Section {
    margin-top: 16px;
}

.Buttons {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
}

.Btn {
    padding: 8px 10px;
    cursor: pointer;
    background: white;
    border: 1px solid #ccc;
    border-radius: 8px;
}

.Routes {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
}

.Routes a {
    text-decoration: none;
    border-bottom: 1px solid #888;
}

.Toc {
    display: grid;
    gap: 6px;
    padding-left: 18px;
    margin: 0;
    font-size: 12px;
    color: #444;
}

.TocItem {
    line-height: 1.5;
}

.Help {
    margin: 0 0 10px;
    font-size: 12px;
    color: #444;
}

.LastAction {
    margin-top: 10px;
    font-size: 12px;
    color: #444;
}

.LastResult {
    margin-top: 6px;
    font-size: 12px;
    color: #999;
}
</style>
