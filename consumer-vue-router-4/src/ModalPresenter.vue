<template>
    <LayergeTransition>
        <div class="modal-shell">
            <RouterView />
        </div>
    </LayergeTransition>
</template>

<script setup>
import {RouterView} from 'vue-router';
import {LayergeTransition} from 'layerge';
</script>
