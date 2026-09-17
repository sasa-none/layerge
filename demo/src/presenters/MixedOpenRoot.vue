<template>
    <div class="MixedRoot">
        <h2 data-testid="mixed-open-title">PR3 Mixed Stack (open → push → replace)</h2>

        <p class="Help">
            This presenter is opened via
            <code>modal.open(Component)</code>
            (no URL navigation). Use the buttons below to stack presenters with different navigation types.
        </p>

        <div class="Buttons">
            <button type="button" class="Btn" data-testid="mixed-open-to-push" @click="pushNext">
                push: modal.push(Component, {url:'/mixed/push'})
            </button>
            <button type="button" class="Btn" data-testid="mixed-open-closeall" @click="closeAll">
                closeAll (restoreUrl: true)
            </button>
        </div>
    </div>
</template>

<script setup>
import {useRouter} from 'vue-router';
import {useLayerge} from 'layerge';

import MixedPushContent from './MixedPushContent.vue';

const router = useRouter();
const layerge = useLayerge();

const pushNext = () => {
    router.modal.push(MixedPushContent, {url: '/mixed/push'});
};

const closeAll = () => {
    layerge.closeAll();
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
