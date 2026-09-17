<template>
    <div class="Page" data-testid="v3-advanced">
        <h1 class="Title">v3 advanced demo</h1>

        <p class="Desc">
            This page exists for <b>manual verification</b> of v3-only behaviors:
            <b>controlledHooks</b> and <b>usePresenterLeaveGuard</b>.
        </p>

        <div class="Section">
            <h2 class="SubTitle">controlledHooks toggles</h2>
            <p class="Help">
                These toggles update <code>window.__layergeDemoFlags</code>.
                When enabled, the corresponding action should be cancelled.
            </p>

            <label class="Row">
                <input type="checkbox" v-model="flags.cancelOpen" data-testid="v3-cancel-open" />
                cancelOpen (beforeOpen)
            </label>
            <label class="Row">
                <input type="checkbox" v-model="flags.cancelNavigate" data-testid="v3-cancel-navigate" />
                cancelNavigate (beforeNavigate)
            </label>
            <label class="Row">
                <input type="checkbox" v-model="flags.cancelClose" data-testid="v3-cancel-close" />
                cancelClose (beforeClose)
            </label>

            <div class="Buttons">
                <button type="button" class="Btn" data-testid="v3-open" @click="openComponent">
                    modal.open(component)
                </button>
                <button type="button" class="Btn" data-testid="v3-push" @click="pushWithFakePath">
                    modal.push(component, { fakePath: '/modal/v3-guard' })
                </button>
                <button type="button" class="Btn" data-testid="v3-close-top" @click="closeTop">
                    closeTop()
                </button>
                <button type="button" class="Btn" data-testid="v3-close-async" @click="closeAsyncLast">
                    closeAsync(lastEntryId)
                </button>
                <button type="button" class="Btn" data-testid="v3-close-all" @click="closeAll">
                    closeAll()
                </button>
            </div>

            <div class="Log" data-testid="v3-state">
                state: {{ state.mode }} / depth={{ state.depth }} | url={{ url }} | lastEntryId={{ lastEntryId || '-' }}
            </div>
        </div>

        <div class="Section">
            <h2 class="SubTitle">Leave Guard notes</h2>
            <ul class="HelpList">
                <li>
                    Open the presenter (open or push) and keep <b>dirty</b> checked in the presenter.
                </li>
                <li>Try closing; you should see a confirmation dialog.</li>
                <li>
                    Choosing <b>Cancel</b> keeps the presenter open. Choosing <b>OK</b> closes.
                </li>
                <li>
                    When opened via <b>push+fakePath</b>, using the browser back button should also trigger the guard.
                </li>
            </ul>
        </div>

        <div class="Section">
            <h2 class="SubTitle">Async API (pushAsync)</h2>
            <p class="Help">
                These buttons exist for <b>manual verification</b> and <b>e2e stability</b>.
                <br />
                "slow" uses <code>?delay=800</code> to stay pending, then "fast" should supersede it.
            </p>

            <div class="Buttons">
                <button type="button" class="Btn" data-testid="v3-push-async-slow" @click="pushAsyncSlow">
                    pushAsync(slow)
                </button>
                <button type="button" class="Btn" data-testid="v3-push-async-fast" @click="pushAsyncFast">
                    pushAsync(fast)
                </button>
            </div>

            <div class="Log" data-testid="v3-async-log">{{ asyncLog }}</div>
        </div>

        <div class="Section">
            <RouterLink class="BtnLink" to="/">Back to home</RouterLink>
        </div>
    </div>
</template>

<script setup>
import {computed, nextTick, reactive, ref} from 'vue';
import {useRoute, useRouter} from 'vue-router';
import {useLayerge} from 'layerge';
import V3LeaveGuardContent from '../components/V3LeaveGuardContent.vue';

const router = useRouter();
const route = useRoute();
const layerge = useLayerge();

// Window flags are initialized in demo/src/router.js
const flags = reactive(window.__layergeDemoFlags ?? {cancelOpen: false, cancelNavigate: false, cancelClose: false});
window.__layergeDemoFlags = flags;

const openComponent = () => {
    // PresenterHandle does not expose entryId; get it from the store stack instead.
    router.modal.open(V3LeaveGuardContent);

    void nextTick(() => {
        const top = router.$layerge?.stack?.[router.$layerge.stack.length - 1];
        lastEntryId.value = top?.id ?? '';
    });
};

const pushWithFakePath = () => {
    router.modal.push(V3LeaveGuardContent, {fakePath: '/modal/v3-guard'});

    void nextTick(() => {
        const top = router.$layerge?.stack?.[router.$layerge.stack.length - 1];
        lastEntryId.value = top?.id ?? '';
    });
};

const closeTop = () => {
    layerge.closeTop();
};

const closeAll = () => {
    layerge.closeAll();
    lastEntryId.value = '';
};

    const state = computed(() => router.getLayergeState());
    const url = computed(() => route.fullPath);

    const lastEntryId = ref('');

    const asyncLog = ref('');

    const appendAsyncLog = (line) => {
        asyncLog.value = `${asyncLog.value}${asyncLog.value ? '\n' : ''}${line}`;
    };

    const closeAsyncLast = async () => {
        appendAsyncLog('closeAsync: start');

        if (!lastEntryId.value) {
            appendAsyncLog('closeAsync: aborted (no entryId)');
            return;
        }

        const res = await router.modal.closeAsync(lastEntryId.value);
        appendAsyncLog(`closeAsync: ${res.status}`);
    };


const pushAsyncSlow = async () => {
    appendAsyncLog('pushAsync(slow): start');
    const res = await router.modal.pushAsync('/page-b?delay=800');
    appendAsyncLog(`pushAsync(slow): ${res.status}`);
};

// Expose for presenter-side buttons (so tests can click inside the overlay).
window.__layergeDemoCloseAsyncLast = closeAsyncLast;


    const pushAsyncFast = async () => {
    appendAsyncLog('pushAsync(fast): start');
    const res = await router.modal.pushAsync('/page-c');
    appendAsyncLog(`pushAsync(fast): ${res.status}`);
};
</script>

<style scoped>
.Page {
    padding: 16px;
}
.Title {
    margin: 0 0 8px;
}
.Desc {
    margin: 0 0 16px;
    color: #333;
}
.Section {
    margin-top: 16px;
    padding: 12px;
    border: 1px solid #0002;
    border-radius: 12px;
}
.SubTitle {
    margin: 0 0 8px;
}
.Help {
    margin: 0 0 12px;
    font-size: 14px;
    line-height: 1.4;
}
.HelpList {
    margin: 0;
    padding-left: 20px;
    font-size: 14px;
    line-height: 1.4;
}
.Row {
    display: flex;
    gap: 8px;
    align-items: center;
    margin: 8px 0;
}
.Buttons {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 8px;
}
.Btn {
    padding: 8px 12px;
}
.BtnLink {
    display: inline-block;
    padding: 8px 12px;
    border: 1px solid #0003;
    border-radius: 8px;
    text-decoration: none;
}
.Log {
    margin-top: 12px;
    padding: 8px;
    background: #1111;
    border-radius: 8px;
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;
    font-size: 12px;
    word-break: break-all;
}
</style>
