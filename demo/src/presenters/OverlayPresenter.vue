<template>
    <LayergeTransition appear name="overlay">
        <div class="PresenterRoot" :style="rootStyle" data-testid="overlay-presenter">
            <button
                v-if="isTop"
                type="button"
                class="Backdrop"
                @click="close"
                aria-label="Close overlay"
            ></button>

            <div class="Panel" role="dialog" aria-modal="true">
                <div class="Header">
                    <div class="Title">OverlayPresenter</div>
                    <button type="button" class="CloseBtn" data-testid="overlay-close" @click="close">
                        Close
                    </button>
                </div>

                <div class="Meta">
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
    </LayergeTransition>
</template>

<script setup>
import {computed} from 'vue';
import ErrorBoundary from '../components/ErrorBoundary.vue';
import EntryInfo from '../components/EntryInfo.vue';
import {usePresenter} from 'layerge';
import {usePresenterBindings} from 'layerge';

const {handle, isTop} = usePresenter();
const entry = usePresenterBindings((ctx) => ctx);

const close = () => {
    handle.close();
};

const rootStyle = computed(() => {
    // Presenter is responsible for Z-order.
    return {
        zIndex: 1000 + entry.index
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
    background: rgb(0 0 0 / 35%);
}

.Panel {
    position: absolute;
    top: 50%;
    left: 50%;
    width: min(640px, 92vw);
    max-height: 88vh;
    overflow: auto;
    background: white;
    border: 1px solid #ddd;
    border-radius: 12px;
    transform: translate(-50%, -50%);
}

.Header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 14px;
    border-bottom: 1px solid #eee;
}

.Title {
    font-weight: 700;
}

.CloseBtn {
    padding: 6px 10px;
    cursor: pointer;
    background: white;
    border: 1px solid #ccc;
    border-radius: 8px;
}

.Meta {
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
.overlay-enter-active,
.overlay-leave-active {
    transition: opacity 180ms ease;
}

.overlay-enter-from,
.overlay-leave-to {
    opacity: 0;
}

.overlay-enter-active .Panel,
.overlay-leave-active .Panel {
    transition: transform 180ms ease;
}

.overlay-enter-from .Panel,
.overlay-leave-to .Panel {
    transform: translate(-50%, -50%) scale(0.98);
}

.overlay-enter-to .Panel,
.overlay-leave-from .Panel {
    transform: translate(-50%, -50%) scale(1);
}
</style>
