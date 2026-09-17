<template>
    <div class="MixedRoot">
        <h2 data-testid="mixed-push-title">PR3 Mixed Stack - Push</h2>
        <p class="Help">
            Opened via
            <code>modal.push(Component, {fakePath})</code>
            .
        </p>

        <div class="Buttons">
            <button type="button" class="Btn" data-testid="mixed-push-to-replace" @click="replaceNext">
                replace: modal.replace(Component, {fakePath:'/mixed/replace'})
            </button>
            <button type="button" class="Btn" data-testid="mixed-push-close" @click="closeTop">
                closeTop
            </button>
            <button
                type="button"
                class="Btn"
                data-testid="mixed-push-close-norestore"
                @click="closeTopNoRestore"
            >
                closeTop (restoreUrl: false)
            </button>
        </div>
    </div>
</template>

<script setup>
import {useRouter} from 'vue-router';
import {useLayerge} from 'layerge';

import MixedReplaceContent from './MixedReplaceContent.vue';

const router = useRouter();
const layerge = useLayerge();

const replaceNext = () => {
    router.modal.replace(MixedReplaceContent, {fakePath: '/mixed/replace'});
};

const closeTop = () => {
    layerge.closeTop();
};

const closeTopNoRestore = () => {
    layerge.closeTop({restoreUrl: false});
};
</script>

<style scoped>
.MixedRoot {
    padding: 16px;
}

.Help {
    margin: 0 0 12px;
}

.Buttons {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
}

.Btn {
    padding: 8px 12px;
}
</style>
