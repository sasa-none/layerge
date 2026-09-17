<template>
    <div>
        <slot v-if="!error" />
        <div v-else class="ErrorRoot" data-testid="presenter-error">
            <div class="ErrorTitle">Failed to render content</div>
            <div class="ErrorMessage">{{ errorMessage }}</div>
            <div class="ErrorActions">
                <button type="button" class="Btn" @click="reset">Dismiss</button>
            </div>
        </div>
    </div>
</template>

<script setup>
import {computed, onErrorCaptured, ref} from 'vue';
import {lastAction, reportRenderError} from '../navLog';

const error = ref(null);

const errorMessage = computed(() => {
    if (!error.value) {
        return '';
    }

    if (typeof error.value === 'object' && error.value && 'message' in error.value) {
        return String(error.value.message);
    }

    return String(error.value);
});

const reset = () => {
    error.value = null;
};

onErrorCaptured((err) => {
    error.value = err;

    reportRenderError(lastAction.value || 'render', err);

    // prevent the error from propagating further and crashing the app
    return false;
});
</script>

<style scoped>
.ErrorRoot {
    padding: 12px;
    border: 1px solid #d66;
    background: rgba(255, 0, 0, 0.06);
    border-radius: 8px;
}

.ErrorTitle {
    font-weight: 600;
    margin-bottom: 6px;
}

.ErrorMessage {
    font-size: 12px;
    line-height: 1.4;
    white-space: pre-wrap;
}

.ErrorActions {
    margin-top: 10px;
}

.Btn {
    padding: 6px 10px;
    cursor: pointer;
    background: white;
    border: 1px solid #ccc;
    border-radius: 8px;
}
</style>
