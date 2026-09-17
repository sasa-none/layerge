<template>
    <div class="OpenOnlyRoot">
        <h2 data-testid="modal-openonly-title">Open Content</h2>
        <p>
            This is opened via
            <code>router.modal.open(Component)</code>
            (no URL navigation).
        </p>

        <div class="Buttons">
            <button type="button" class="Btn" data-testid="openonly-close-twice" @click="closeTwice">
                closeTop ×2 (idempotent)
            </button>
        </div>
    </div>
</template>

<script setup>
import {useLayerge} from 'layerge';

const layerge = useLayerge();

const closeTwice = () => {
    layerge.closeTop();
    layerge.closeTop();
};
</script>

<style scoped>
.OpenOnlyRoot {
    padding: 16px;
}

.Buttons {
    margin-top: 12px;
}

.Btn {
    padding: 8px 12px;
}
</style>
