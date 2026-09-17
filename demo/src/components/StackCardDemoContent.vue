<template>
    <div class="Card">
        <h3 class="Title">Stack Card Demo</h3>
        <p class="Text">
            Opened via
            <code>stackCard.push(Component)</code>
            (no URL navigation).
        </p>

        <EntryInfo />

        <div class="Actions">
            <button type="button" class="Btn" @click="close">closeTop</button>
        </div>
    </div>
</template>

<script setup>
import {useLayerge} from 'layerge';
import EntryInfo from './EntryInfo.vue';

const layerge = useLayerge();
const close = () => {
    layerge.closeTop();
};
</script>

<style scoped>
.Card {
    padding: 12px;
    border-radius: 12px;
    border: 1px solid #ccc;
    background: #fff;
    display: grid;
    gap: 8px;
}
.Title {
    margin: 0;
    font-size: 14px;
}
.Text {
    margin: 0;
    font-size: 12px;
    color: #333;
}
.Actions {
    display: flex;
    gap: 8px;
}
.Btn {
    padding: 6px 10px;
    cursor: pointer;
    background: white;
    border: 1px solid #ccc;
    border-radius: 8px;
}
</style>
