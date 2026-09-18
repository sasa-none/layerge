<template>
    <PageShell title="Cache State">
        <div class="Body" data-testid="cache-root" :data-cache-context="cacheContext">
            <p class="Help">
                This page is used to demonstrate StackCard cache behavior. If StackCard is configured with
                <code>cache:true</code>
                , navigating back should keep the values below.
            </p>

            <div class="Block">
                <h2 class="BlockTitle">Kept state</h2>
                <div>
                    mount id:
                    <code data-testid="cache-mount-id">{{ mountId }}</code>
                </div>
                <div>
                    counter:
                    <code data-testid="cache-counter">{{ counter }}</code>
                    <button type="button" class="Btn" data-testid="cache-inc" @click="inc">+1</button>
                </div>
            </div>

            <div class="Block">
                <h2 class="BlockTitle">Text input</h2>
                <label class="Label" for="cache-input">text:</label>
                <input id="cache-input" v-model="text" class="Input" data-testid="cache-input" />
                <div>
                    current:
                    <code data-testid="cache-text">{{ text }}</code>
                </div>
            </div>

            <div class="Block">
                <h2 class="BlockTitle">Navigation</h2>
                <button type="button" class="Btn" data-testid="cache-push-page-a" @click="pushPageA">
                    stackCard.push('/page-a')
                </button>
                <button type="button" class="Btn" data-testid="cache-open-modal" @click="openModalOnTop">
                    modal.open(Component) on top
                </button>
                <p class="Help">Push a new page on top, then go back to verify cached state remains.</p>
            </div>
        </div>
    </PageShell>
</template>

<script setup>
import {onMounted, ref, computed} from 'vue';
import {usePresenter} from 'layerge';
import {useRouter} from 'vue-router';
import ModalOpenContent from '../components/ModalOpenContent.vue';
import PageShell from './_PageShell.vue';

const router = useRouter();
const presenter = usePresenter();

const mountId = ref('');
const counter = ref(0);
const text = ref('');

onMounted(() => {
    mountId.value = String(Date.now());
});

const pushPageA = () => {
    router.stackCard.push('/page-a');
};

const inc = () => {
    counter.value += 1;
};

const openModalOnTop = () => {
    router.modal.open(ModalOpenContent);
};

const cacheContext = computed(() => (presenter?.handle ? 'stackcard' : 'page'));
</script>

<style scoped>
.Body {
    display: grid;
    gap: 12px;
}

.Help {
    margin: 0;
    font-size: 12px;
    color: #444;
}

.BlockTitle {
    margin: 0;
    font-size: 14px;
}

.Block {
    display: grid;
    gap: 8px;
    padding: 12px;
    border: 1px solid #ddd;
    border-radius: 8px;
}

.Label {
    font-size: 12px;
    color: #444;
}

.Input {
    padding: 8px;
    border: 1px solid #ccc;
    border-radius: 8px;
}

.Btn {
    padding: 6px 8px;
    margin-left: 8px;
    cursor: pointer;
    background: white;
    border: 1px solid #ccc;
    border-radius: 8px;
}
</style>
