import {createRouter, createWebHistory} from 'vue-router';
import {createLayergeRouter} from 'layerge';

import HomePage from './pages/HomePage.vue';
import DemoPage from './pages/DemoPage.vue';
import PageA from './pages/PageA.vue';
import NotFoundPage from './pages/NotFoundPage.vue';
import BridgeUrlOverlayPage from './pages/BridgeUrlOverlayPage.vue';
import BridgeModalCacheDemoPage from './pages/BridgeModalCacheDemoPage.vue';
import CacheStatePage from './pages/CacheStatePage.vue';
import TransitionDemoPage from './pages/TransitionDemoPage.vue';
import LinksDemoPage from './pages/LinksDemoPage.vue';
import AdvancedDemoPage from './pages/AdvancedDemoPage.vue';

import {initNavLog} from './navLog';

import OverlayPresenter from './presenters/OverlayPresenter.vue';
import OverlayPresenterWithHooks from './presenters/OverlayPresenterWithHooks.vue';
import OverlayPresenterNoTransition from './presenters/OverlayPresenterNoTransition.vue';
import StackCardPresenter from './presenters/StackCardPresenter.vue';
import StackCardPresenterNoTransition from './presenters/StackCardPresenterNoTransition.vue';

/**
 * createDemoRouter
 * @returns {import('vue-router').Router} Layerge 拡張済みの Router インスタンス
 */
const createDemoRouter = () => {
    const router = createRouter({
        history: createWebHistory(),
        routes: [
            {path: '/', component: HomePage},
            // bridge routes (deep link entry points)
            {path: '/modal/url-overlay', component: BridgeUrlOverlayPage},
            {path: '/modal/cache-demo', component: BridgeModalCacheDemoPage},

            {path: '/page-a', component: PageA},
            {path: '/page-b', component: DemoPage, props: {title: 'Page B'}},
            {path: '/page-c', component: DemoPage, props: {title: 'Page C'}},
            {path: '/page-d', component: DemoPage, props: {title: 'Page D'}},
            {path: '/page-e', component: DemoPage, props: {title: 'Page E'}},

            {path: '/cache-state', component: CacheStatePage},
            {path: '/transition', component: TransitionDemoPage},
            {path: '/links', component: LinksDemoPage},
            {path: '/advanced', component: AdvancedDemoPage},
            // catch-all (demo)
            {path: '/:pathMatch(.*)*', component: NotFoundPage}
        ]
    });

    // v4.2 E2E 用: 意図的に失敗させるスイッチ
    // - ?__fail=throw_guard  ... beforeEach が throw
    // - ?__fail=reject_guard ... beforeEach が Promise.reject
    // - ?__fail=reject_push  ... router.push/replace が reject（現在/遷移先 query で判定）
    router.beforeEach((to, from) => {
        // NOTE: Fail switch is evaluated on "from" to avoid breaking initial page load.
        // This lets us open a page with ?__fail=throw_guard and then trigger the failure on the next navigation.
        const failFrom = from && from.query && typeof from.query.__fail === 'string' ? from.query.__fail : '';
        const fail = failFrom;

        if (!fail) {
            return true;
        }

        if (fail === 'throw_guard') {
            throw new Error('[Layerge demo] throw_guard');
        }

        if (fail === 'reject_guard') {
            return Promise.reject(new Error('[Layerge demo] reject_guard'));
        }

        return true;
    });

    const shouldRejectNavTargetInternal = (to) => {
        const current = router.currentRoute && router.currentRoute.value ? router.currentRoute.value : null;
        const currentFail =
            current && current.query && typeof current.query.__fail === 'string' ? current.query.__fail : '';
        if (currentFail === 'reject_push') {
            return true;
        }

        if (!to) {
            return false;
        }

        // string
        if (typeof to === 'string') {
            return to.includes('__fail=reject_push');
        }

        // RouteLocationRaw object
        if (typeof to === 'object' && to.query && typeof to.query.__fail === 'string') {
            return to.query.__fail === 'reject_push';
        }

        return false;
    };

    const originalPush = router.push.bind(router);
    const originalReplace = router.replace.bind(router);

    // demo only: router.push/replace を意図的に reject できるようにする
    router.push = (to) => {
        if (shouldRejectNavTargetInternal(to)) {
            return Promise.reject(new Error('[Layerge demo] reject_push'));
        }

        return originalPush(to);
    };

    router.replace = (to) => {
        if (shouldRejectNavTargetInternal(to)) {
            return Promise.reject(new Error('[Layerge demo] reject_push'));
        }

        return originalReplace(to);
    };

    // demo only: optionally delay navigation via query (?delay=800)
    // NOTE: returning a Promise lets vue-router handle cancellation correctly.
    router.beforeEach((to) => {
        const delayRaw = to.query && 'delay' in to.query ? to.query.delay : undefined;
        let delay = 0;

        // クエリパラメータdelayの値を数値に変換
        if (typeof delayRaw === 'string') {
            delay = Number(delayRaw);
        } else if (Array.isArray(delayRaw)) {
            delay = Number(delayRaw[0]);
        }

        const cancelRaw = to.query && 'cancel' in to.query ? to.query.cancel : undefined;
        const cancel =
            cancelRaw === '1' || cancelRaw === 'true' || (Array.isArray(cancelRaw) && cancelRaw[0] === '1');

        if (!Number.isFinite(delay) || delay <= 0) {
            return cancel ? false : true;
        }

        return new Promise((resolve) => {
            window.setTimeout(() => {
                resolve(cancel ? false : true);
            }, delay);
        });
    });

    // demo only: global flags to toggle controlledHooks behaviors in /advanced

    window.__layergeDemoFlags = window.__layergeDemoFlags || {
        cancelClose: false,
        cancelOpen: false,
        cancelNavigate: false
    };

    const layergeRouter = createLayergeRouter({
        router: router,
        debug: true,
        controlledHooks: {
            beforeClose: () => {
                return window.__layergeDemoFlags?.cancelClose ? false : true;
            },
            beforeOpen: () => {
                return window.__layergeDemoFlags?.cancelOpen ? false : true;
            },
            beforeNavigate: () => {
                return window.__layergeDemoFlags?.cancelNavigate ? false : true;
            }
        },
        presenters: {
            modal: {
                component: OverlayPresenter,
                display: 'top'
            },
            // Presenter variant for non-animated rendering (no <LayergeTransition>)
            modalNoTransition: {
                component: OverlayPresenterNoTransition,
                display: 'top'
            },
            modalHooks: {
                component: OverlayPresenterWithHooks,
                display: 'top'
            },
            stackCard: {
                component: StackCardPresenter,
                display: 'stack+cache'
            },
            // Non-animated variant for stack+cache presenter
            stackCardNoTransition: {
                component: StackCardPresenterNoTransition,
                display: 'stack+cache'
            }
        }
    });

    initNavLog(layergeRouter);

    return layergeRouter;
};

export {createDemoRouter};
