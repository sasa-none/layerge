<template>
    <div class="Wrap" data-testid="v3-leave-guard-content">
        <h3 class="Title">V3 Leave Guard Content</h3>

        <div class="Help">
            <div>Toggle <b>dirty</b>/<b>pending</b>, then try closing via:</div>
            <ul>
                <li>the page buttons (closeTop / closeAll)</li>
                <li>the browser back button (when opened with push+fakePath)</li>
                <li>Esc key (if enabled in your environment)</li>
            </ul>
            <div>
                When <b>pending</b> is true, Layerge waits <b>commit()</b> before proceeding.
                When <b>dirty</b> is true, the guard should prompt confirmation.
            </div>
        </div>

        <label class="Row">
            <input type="checkbox" v-model="dirty" data-testid="v3-dirty" />
            dirty (block leaving until confirmed)
        </label>

        <label class="Row">
            <input type="checkbox" v-model="pending" data-testid="v3-pending" />
            pending (wait commit() before closing)
        </label>

        <label class="Row">
            <span class="Label">commit delay (ms)</span>
            <input
                class="Input"
                type="number"
                min="0"
                step="50"
                v-model.number="commitDelayMs"
                data-testid="v3-commit-delay"
            />
        </label>

        <label class="Row">
            <input type="checkbox" v-model="useConfirm" data-testid="v3-use-confirm" />
            use window.confirm (recommended)
        </label>

        <div class="Buttons">
            <button type="button" class="Btn" data-testid="v3-close-self" @click="closeSelf">
                closeTop()
            </button>
            <button type="button" class="Btn" data-testid="v3-close-async-self" @click="closeAsyncSelf">
                closeAsync(lastEntryId)
            </button>
        </div>

        <div class="Log" data-testid="v3-leave-guard-log">{{ log }}</div>
    </div>
</template>

<script setup>
import {ref, watch} from 'vue';
import {useLayerge, usePresenterLeaveGuard} from 'layerge';

const layerge = useLayerge();

const dirty = ref(true);
const pending = ref(false);
const commitDelayMs = ref(300);
const useConfirm = ref(true);
const message = ref('You have unsaved changes. Close anyway?');
const log = ref('');

watch([dirty, pending, commitDelayMs], ([d, p, ms]) => {
    log.value = `dirty=${d} pending=${p} delay=${ms}ms`;
}, {immediate: true});

usePresenterLeaveGuard({
    dirty,
    pending,
    commit: async () => {
        const delay = Number(commitDelayMs.value);
        const ms = Number.isFinite(delay) && delay >= 0 ? delay : 0;

        // Simulate a save/commit.
        await new Promise((r) => {
            setTimeout(r, ms);
        });

        // Best-effort: mark pending finished.
        pending.value = false;
    },
    message,
    confirm: async (ctx) => {
        if (!useConfirm.value) {
            return true;
        }

        // eslint-disable-next-line no-alert
        return window.confirm(`${message.value}\n(reason=${ctx.reason}, entryId=${ctx.entryId})`);
    }
});

const closeSelf = () => {
    layerge.closeTop();
};

const closeAsyncSelf = async () => {
    const fn = window.__layergeDemoCloseAsyncLast;
    if (typeof fn === 'function') {
        await fn();
    }
};
</script>

<style scoped>
.Wrap {
    padding: 16px;
}
.Title {
    margin: 0 0 8px;
}
.Help {
    margin: 0 0 12px;
    font-size: 14px;
    line-height: 1.4;
}
.Row {
    display: flex;
    gap: 8px;
    align-items: center;
    margin: 8px 0;
}
.Label {
    min-width: 120px;
}
.Input {
    width: 120px;
}
.Buttons {
    margin-top: 12px;
}
.Btn {
    padding: 8px 12px;
}
.Log {
    margin-top: 12px;
    padding: 8px;
    background: #1112;
    border-radius: 8px;
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono',
        'Courier New', monospace;
    font-size: 12px;
}
</style>
