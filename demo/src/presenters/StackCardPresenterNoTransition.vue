<template>
    <!-- Non-animated variant: no <LayergeTransition> -->
    <div class="PresenterRoot" :style="rootStyle" data-testid="stackcard-presenter">
        <button
            v-if="isTop"
            type="button"
            class="Backdrop"
            @click="close"
            aria-label="Close overlay"
        ></button>

        <div class="Card" role="dialog" aria-modal="true">
            <div class="Header">
                <div class="Title">StackCardPresenter (Non-animated)</div>
                <div class="Meta">
                    <span>top: {{ isTop }}</span>
                    <span>index: {{ entry.index }}</span>
                    <span>depth: {{ entry.depth }}</span>
                </div>
                <button type="button" class="CloseBtn" data-testid="stackcard-close" @click="close">
                    Close
                </button>
            </div>

            <div class="Info">
                <EntryInfo />
            </div>

            <div class="Content">
                <ErrorBoundary>
                    <Suspense>
                        <slot />
                        <template #fallback>
                            <div class="Loading" data-testid="presenter-loading">Loading...</div>
                        </template>
                    </Suspense>
                </ErrorBoundary>
            </div>
        </div>
    </div>
</template>

<script setup>
import {computed} from 'vue';
import ErrorBoundary from '../components/ErrorBoundary.vue';
import EntryInfo from '../components/EntryInfo.vue';
import {usePresenter, usePresenterBindings} from 'layerge';

const {handle, isTop} = usePresenter();
const entry = usePresenterBindings((ctx) => ctx);

const close = () => {
    handle.close();
};

const rootStyle = computed(() => {
    const y = entry.index * 14;

    return {
        zIndex: 1000 + entry.index,
        // Let the stack be readable: deeper entries are slightly shifted.
        '--card-offset-y': `${y}px`
    };
});
</script>

<style scoped>
.PresenterRoot {
    position: absolute;
    inset: 0;
}

.Backdrop {
    position: absolute;
    inset: 0;
    padding: 0;
    cursor: pointer;
    background: rgb(0 0 0 / 25%);
    border: 0;
}

.Card {
    position: absolute;
    top: 24px;
    left: 50%;
    width: min(560px, 92vw);
    max-height: calc(100vh - 48px);
    overflow: auto;
    background: white;
    border: 1px solid #ddd;
    border-radius: 14px;
    box-shadow: 0 12px 30px rgb(0 0 0 / 12%);
    transform: translateX(-50%) translateY(var(--card-offset-y, 0));
}

.Header {
    display: grid;
    grid-template-columns: 1fr auto auto;
    gap: 10px;
    align-items: center;
    padding: 12px 14px;
    border-bottom: 1px solid #eee;
}

.Title {
    font-weight: 700;
}

.Meta {
    display: flex;
    gap: 8px;
    font-size: 12px;
    color: #666;
}

.CloseBtn {
    padding: 6px 10px;
    cursor: pointer;
    background: white;
    border: 1px solid #ccc;
    border-radius: 8px;
}

.Info {
    padding: 10px 14px;
    border-bottom: 1px solid #eee;
}

.Content {
    padding: 14px;
}

.Loading {
    padding: 10px 12px;
    font-size: 12px;
    color: #666;
    background: #f6f7f9;
    border: 1px solid #e5e7eb;
    border-radius: 10px;
}

/* Transition (Presenter responsibility) */
.card-enter-active,
.card-leave-active {
    transition: opacity 180ms ease;
}

.card-enter-from,
.card-leave-to {
    opacity: 0;
}

.card-enter-active .Card,
.card-leave-active .Card {
    transition: transform 180ms ease;
}

.card-enter-from .Card,
.card-leave-to .Card {
    transform: translateX(-50%) translateY(var(--card-offset-y, 0)) scale(0.98);
}

.card-enter-to .Card,
.card-leave-from .Card {
    transform: translateX(-50%) translateY(var(--card-offset-y, 0)) scale(1);
}
</style>
