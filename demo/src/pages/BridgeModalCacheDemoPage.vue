<template>
    <div class="BridgeRoot">
        <h1 class="Title">Bridge route: /modal/cache-demo</h1>
        <p class="Help">
            This route opens StackCard with a stateful page (
            <code>/cache-state</code>
            ). Use the back button to verify whether cached state is preserved.
        </p>
    </div>
</template>

<script setup>
import {onMounted} from 'vue';
import {useRouter} from 'vue-router';
import {lastAction, lastResult, trackNavigation} from '../navLog';

const router = useRouter();

onMounted(async () => {
    lastAction.value = 'bridge: /modal/cache-demo';
    lastResult.value = '';

    // IMPORTANT:
    // We first move the app route to /cache-state, then open StackCard view-only on the *current* route.
    // This avoids a loop where close() restores to /modal/cache-demo and immediately re-triggers this bridge.
    trackNavigation("router.replace('/cache-state')", '/cache-state');
    await router.replace('/cache-state');

    trackNavigation("stackCard.open('/cache-state')", '/cache-state');
    router.stackCard.open('/cache-state');
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
    margin: 0;
    font-size: 12px;
    color: #444;
}
</style>
