<template>
    <div class="BridgeRoot">
        <h1 class="Title">Bridge route: /modal/url-overlay</h1>
        <p class="Help">
            This page is an entry point for deep links. It moves the app to a real page (Home) and then
            re-opens the modal presenter on top of it, navigating to
            <code>/no-route/help</code>
            via
            <code>url</code>
            .
        </p>
        <p class="Help">
            A bridge route owns the answer to "where does the user land after closing?". Without the
            <code>replace</code>
            to a real page, closing the overlay would strand the user on this scaffold.
        </p>
        <p class="Help">
            If you see this page for more than a moment, something prevented the presenter navigation.
        </p>
    </div>
</template>

<script setup>
import {onMounted} from 'vue';
import {useRouter} from 'vue-router';
import {lastAction, lastResult, trackNavigation} from '../navLog';

import UrlOverlayContent from '../presenters/UrlOverlayContent.vue';

const router = useRouter();

onMounted(async () => {
    lastAction.value = 'bridge: /modal/url-overlay';
    lastResult.value = '';

    // IMPORTANT:
    // bridge route は「オーバーレイを閉じた後にどこへ着地するか」を決める責任を持つ。
    // 先にアプリの実ページへ replace しておかないと、閉じたときにこの足場ページへ
    // 取り残される（deep link を共有された利用者が最初に踏む落とし穴）。
    trackNavigation("router.replace('/')", '/');
    await router.replace('/');

    trackNavigation("modal.replace(Component, {url:'/no-route/help'})", '/no-route/help');
    router.modal.replace(UrlOverlayContent, {url: '/no-route/help'});
});
</script>

<style scoped>
.BridgeRoot {
    padding: 16px;
    font-family:
        system-ui,
        -apple-system,
        'Segoe UI',
        Roboto,
        sans-serif;
}

.Title {
    margin: 0 0 8px;
    font-size: 18px;
}

.Help {
    margin: 0 0 8px;
    font-size: 12px;
    color: #444;
}
</style>
