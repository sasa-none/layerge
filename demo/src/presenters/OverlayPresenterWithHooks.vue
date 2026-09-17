<template>
    <LayergeTransition
        appear
        name="overlay"
        @after-enter="onAfterEnter"
        @after-appear="onAfterEnter"
        @after-leave="onAfterLeave"
    >
        <div class="PresenterRoot" :style="rootStyle" data-testid="overlay-presenter-hooks">
            <button
                v-if="isTop"
                type="button"
                class="Backdrop"
                @click="close"
                aria-label="Close overlay"
            ></button>

            <div class="Panel" role="dialog" aria-modal="true">
                <div class="Header">
                    <div class="Title">OverlayPresenter (user hooks)</div>
                    <button type="button" class="CloseBtn" data-testid="overlay-hooks-close" @click="close">
                        Close
                    </button>
                </div>

                <div class="Meta">
                    <EntryInfo />
                    <div class="HookLog" data-testid="hook-log">
                        hook log:
                        <code>{{ hookLog }}</code>
                    </div>
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
import {computed, ref} from 'vue';
import ErrorBoundary from '../components/ErrorBoundary.vue';
import EntryInfo from '../components/EntryInfo.vue';
import {usePresenter, usePresenterBindings} from 'layerge';

const {handle, isTop} = usePresenter();
const entry = usePresenterBindings((ctx) => ctx);

const hookLog = ref('');

const close = () => {
    handle.close();
};

const rootStyle = computed(() => {
    return {
        zIndex: 1000 + entry.index
    };
});

const onAfterEnter = () => {
    hookLog.value = hookLog.value ? `${hookLog.value} | after-enter` : 'after-enter';
};

const onAfterLeave = () => {
    hookLog.value = hookLog.value ? `${hookLog.value} | after-leave` : 'after-leave';
};
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
    display: grid;
    gap: 8px;
    padding: 10px 14px;
    border-bottom: 1px solid #eee;
}

.HookLog {
    font-size: 12px;
    color: #555;
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
