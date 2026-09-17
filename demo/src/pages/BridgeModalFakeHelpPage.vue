<template>
    <div class="BridgeRoot">
        <h1 class="Title">Bridge route: /modal/fake-help</h1>
        <p class="Help">
            This page is an entry point for deep links. It immediately re-opens the modal presenter and
            navigates to
            <code>/fake/help</code>
            via
            <code>url</code>
            .
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

onMounted(() => {
    lastAction.value = 'bridge: /modal/fake-help';
    lastResult.value = '';

    trackNavigation("modal.replace(Component, {url:'/fake/help'})", '/fake/help');
    router.modal.replace(UrlOverlayContent, {url: '/fake/help'});
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
