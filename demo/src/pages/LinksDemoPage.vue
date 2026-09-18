<template>
    <div class="Root" data-testid="links-page">
        <h1 class="Title">Links demo</h1>
        <p class="Help">
            What this page shows: how LayergeLink and useLayergeLink open a presenter the same way RouterLink
            navigates.
        </p>

        <div class="State">
            <div>
                mode:
                <code data-testid="links-mode">{{ mode }}</code>
            </div>
            <div>
                depth:
                <code data-testid="links-depth">{{ depth }}</code>
            </div>
            <div>
                url:
                <code data-testid="links-url">{{ currentUrl }}</code>
            </div>
        </div>

        <div class="Section">
            <h2 class="SubTitle">LayergeLink</h2>
            <p class="Help">RouterLink-compatible entry points (push / replace / open).</p>

            <div class="Buttons">
                <LayergeLink
                    presenter="modal"
                    action="push"
                    :to="{path: '/page-b'}"
                    data-testid="links-layerge-link-push"
                >
                    modal.push('/page-b')
                </LayergeLink>

                <LayergeLink
                    presenter="modal"
                    action="replace"
                    :to="{path: '/page-c'}"
                    data-testid="links-layerge-link-replace"
                >
                    modal.replace('/page-c')
                </LayergeLink>

                <LayergeLink
                    presenter="modal"
                    action="open"
                    :to="{path: '/page-a'}"
                    data-testid="links-layerge-link-open"
                >
                    modal.open('/page-a')
                </LayergeLink>

                <LayergeLink
                    presenter="modal"
                    :to="{path: '/page-d'}"
                    :prevent="false"
                    data-testid="links-layerge-link-prevent-false"
                >
                    prevent=false (meta/ctrl bypass)
                </LayergeLink>

                <LayergeLink
                    presenter="modal"
                    :to="{path: '/page-e'}"
                    :disabled="true"
                    data-testid="links-layerge-link-disabled"
                >
                    disabled=true (no-op)
                </LayergeLink>

                <LayergeLink
                    presenter="modal"
                    action="push"
                    :to="{path: '/page-b'}"
                    :url="{query: {u: '1'}, hash: '#h'}"
                    data-testid="links-layerge-link-url"
                >
                    modal.push('/page-b', {url:{?u=1#h}})
                </LayergeLink>

                <LayergeLink
                    presenter="modal"
                    action="open"
                    :component="InlineOverlay"
                    data-testid="links-layerge-link-open-component"
                >
                    modal.open(Component)
                </LayergeLink>
            </div>

            <div class="SectionSub">
                <h3 class="SubTitleSmall">custom slot</h3>

                <LayergeLink presenter="modal" action="push" :to="{path: '/page-b'}" custom>
                    <template #default="slotProps">
                        <div class="Buttons">
                            <button
                                type="button"
                                class="Btn"
                                data-testid="links-custom-navigate"
                                @click="slotProps.navigate"
                            >
                                custom.navigate()
                            </button>

                            <button
                                type="button"
                                class="Btn"
                                data-testid="links-custom-handler-replace"
                                @click="slotProps.handler.replace"
                            >
                                custom.handler.replace()
                            </button>
                        </div>
                    </template>
                </LayergeLink>
            </div>
        </div>

        <div class="Section">
            <h2 class="SubTitle">useLayergeLink</h2>
            <p class="Help">The supported way to build a custom entry point (bindings / handlers + hooks).</p>

            <div class="Buttons">
                <button
                    type="button"
                    class="Btn"
                    data-testid="links-hooks-open"
                    v-bind="linkA.bindings"
                    @click="linkA.handler.push"
                >
                    useLayergeLink.push('/page-a')
                </button>

                <button
                    type="button"
                    class="Btn"
                    data-testid="links-hooks-open-cancel"
                    v-bind="linkCancel.bindings"
                    @click="linkCancel.handler.push"
                >
                    useLayergeLink.push('/page-a?cancel=1')
                </button>

                <button type="button" class="Btn" data-testid="links-hooks-clear" @click="clearLog">
                    clear log
                </button>
            </div>

            <div class="Log" data-testid="links-hooks-log">
                <div v-for="(line, i) in hookLog" :key="i" class="LogLine">{{ line }}</div>
            </div>
        </div>

        <div class="Section">
            <h2 class="SubTitle">Back</h2>
            <div class="Buttons">
                <RouterLink class="BtnLink" to="/" data-testid="links-back-home">Back to Home</RouterLink>
            </div>
        </div>
    </div>
</template>

<script setup>
import {computed, defineComponent, h, onMounted, ref} from 'vue';
import {useRouter} from 'vue-router';

import {LayergeLink, useLayergeLink} from 'layerge';

const router = useRouter();

// Component-mode demo target
const InlineOverlay = defineComponent({
    name: 'InlineOverlay',
    render() {
        return h('div', {'data-testid': 'inline-overlay'}, 'InlineOverlay');
    }
});

const hookLog = ref([]);

const addLog = (msg) => {
    hookLog.value = [...hookLog.value, msg];
};

const clearLog = () => {
    hookLog.value = [];
};

const createHooks = (prefix) => {
    return {
        beforeOpen: () => addLog(`${prefix}:beforeOpen`),
        opened: ({entryId}) => addLog(`${prefix}:opened:${entryId ?? 'null'}`),
        entered: ({entryId}) => addLog(`${prefix}:entered:${entryId ?? 'null'}`),
        openFailed: (e) => addLog(`${prefix}:openFailed:${e?.message ?? String(e)}`),
        beforeClose: ({entryId}) => addLog(`${prefix}:beforeClose:${entryId ?? 'null'}`),
        closed: ({entryId}) => addLog(`${prefix}:closed:${entryId ?? 'null'}`),
        closeFailed: (e) => addLog(`${prefix}:closeFailed:${e?.message ?? String(e)}`),
        settled: (r) => addLog(`${prefix}:settled:${r?.ok ? 'ok' : 'ng'}:${r?.stage ?? 'unknown'}`)
    };
};

// success path
const linkA = useLayergeLink(
    {path: '/page-a'},
    () => {
        return {
            // basic a11y is opt-in
            role: 'button',
            tabIndex: 0
        };
    },
    createHooks('A')
);

// failure path (cancel by guard)
const linkCancel = useLayergeLink(
    {path: '/page-a', query: {cancel: '1'}},
    () => {
        return {
            role: 'button',
            tabIndex: 0
        };
    },
    createHooks('CANCEL')
);

const mode = computed(() => {
    const $layerge = router?.$layerge;
    return $layerge?.mode ?? 'unknown';
});

const depth = computed(() => {
    const $layerge = router?.$layerge;
    return $layerge?.stack?.length ?? 0;
});

const currentUrl = computed(() => {
    return router.currentRoute.value.fullPath;
});

// Make sure the page is stable when opened directly
onMounted(() => {
    addLog('mounted');

    // Expose for E2E assertions (demo-only)
    // @ts-ignore
    window.__layerge = router?.$layerge;
});
</script>

<style scoped>
.Root {
    padding: 16px;
    font-family:
        ui-sans-serif,
        system-ui,
        -apple-system,
        'Segoe UI',
        Roboto,
        Helvetica,
        Arial,
        'Apple Color Emoji',
        'Segoe UI Emoji';
}

.Title {
    margin: 0 0 12px;
    font-size: 20px;
}

.State {
    display: grid;
    gap: 6px;
    padding: 12px;
    background: #f6f7f9;
    border: 1px solid #e5e7eb;
    border-radius: 12px;
}

.Section {
    padding: 12px;
    margin-top: 16px;
    border: 1px solid #eee;
    border-radius: 12px;
}

.SectionSub {
    padding-top: 12px;
    margin-top: 12px;
    border-top: 1px dashed #eee;
}

.SubTitle {
    margin: 0 0 8px;
    font-size: 16px;
}

.SubTitleSmall {
    margin: 0 0 8px;
    font-size: 14px;
}

.Help {
    margin: 0 0 10px;
    font-size: 12px;
    color: #666;
}

.Buttons {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
}

.Btn,
.BtnLink {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 8px 10px;
    font-size: 12px;
    color: #111;
    text-decoration: none;
    cursor: pointer;
    background: white;
    border: 1px solid #ccc;
    border-radius: 10px;
}

.Log {
    min-height: 84px;
    padding: 10px;
    margin-top: 10px;
    font-size: 12px;
    color: #e5e7eb;
    background: #0b1020;
    border: 1px solid #111827;
    border-radius: 12px;
}

.LogLine {
    line-height: 1.5;
}
</style>
