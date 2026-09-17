<template>
    <div class="MixedRoot">
        <h2 data-testid="mixed-replace-title">PR3 Mixed Stack - Replace</h2>
        <p class="Help">
            Opened via
            <code>modal.replace(Component, {fakePath})</code>
            . Closing this presenter should restore the URL to the prior page (returnTo).
        </p>

        <div class="Buttons">
            <button type="button" class="Btn" data-testid="mixed-replace-close" @click="closeTop">
                closeTop
            </button>
            <button
                type="button"
                class="Btn"
                data-testid="mixed-replace-close-norestore"
                @click="closeTopNoRestore"
            >
                closeTop (restoreUrl: false)
            </button>
            <button type="button" class="Btn" data-testid="mixed-replace-closeall" @click="closeAll">
                closeAll (restoreUrl: true)
            </button>
        </div>
    </div>
</template>

<script setup>
import {useLayerge} from 'layerge';

const layerge = useLayerge();

const closeTop = () => {
    // Close the top-most entry (this presenter) and let Layerge restore URL if needed.
    layerge.closeTop();
};

const closeTopNoRestore = () => {
    layerge.closeTop({restoreUrl: false});
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
