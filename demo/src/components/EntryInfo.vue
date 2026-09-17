<template>
    <div class="EntryInfoRoot" data-testid="entry-info">
        <div class="Row">
            <span class="Label">entryId</span>
            <code class="Value" data-testid="entry-id">{{ entry.entryId }}</code>
        </div>
        <div class="Row">
            <span class="Label">phase</span>
            <code class="Value" data-testid="entry-phase">{{ entry.phase }}</code>
        </div>
        <div class="Row">
            <span class="Label">index</span>
            <code class="Value" data-testid="entry-index">{{ entry.index }}</code>
        </div>
        <div class="Row">
            <span class="Label">depth</span>
            <code class="Value" data-testid="entry-depth">{{ entry.depth }}</code>
        </div>
        <div class="Row">
            <span class="Label">isTop</span>
            <code class="Value" data-testid="entry-istop">{{ entry.isTop }}</code>
        </div>
    </div>
</template>

<script setup>
import {usePresenterBindings} from 'layerge';

const entry = usePresenterBindings((ctx) => ctx);
</script>

<style scoped>
.EntryInfoRoot {
    display: grid;
    gap: 6px;
    padding: 10px;
    background: #f7f8fa;
    border: 1px solid #e5e7eb;
    border-radius: 10px;
}

.Row {
    display: grid;
    grid-template-columns: 64px 1fr;
    gap: 10px;
    align-items: center;
}

.Label {
    font-size: 12px;
    color: #555;
}

.Value {
    font-size: 12px;
}
</style>
