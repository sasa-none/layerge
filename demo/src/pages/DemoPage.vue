<template>
    <div class="PageRoot">
        <h1 class="Title">{{ title }}</h1>
        <p class="Text">This is a normal route component.</p>
        <div class="Buttons">
            <button type="button" class="Btn" @click="close">closeTop</button>
            <button type="button" class="Btn" @click="closeAll">closeAll</button>
            <button type="button" class="Btn" @click="back">back</button>
        </div>
    </div>
</template>

<script setup>
import {useRouter} from 'vue-router';
import {useLayerge} from 'layerge';

defineProps({
    title: {type: String, required: true}
});

const router = useRouter();
const layerge = useLayerge();

const close = () => {
    layerge.closeTop();
};

const closeAll = () => {
    layerge.closeAll();
};

const back = () => {
    router.back();
};
</script>

<style scoped>
.PageRoot {
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

.Text {
    margin: 0 0 12px;
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
</style>
