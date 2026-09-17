<template>
    <div class="Root" data-testid="transition-demo-content">
        <h2 class="Title">Transition Demo Content</h2>
        <p class="Help">
            This content is rendered inside a presenter. It reads
            <code>EntryContext</code>
            via
            <code>usePresenterBindings()</code>
            and provides a couple of actions.
        </p>

        <EntryInfo />

        <div class="Buttons">
            <button type="button" class="Btn" data-testid="demo-content-close" @click="close">
                close (handle.close)
            </button>
            <button type="button" class="Btn" data-testid="demo-content-open-modal" @click="openNestedModal">
                open nested modal.open(Component)
            </button>
            <button type="button" class="Btn" data-testid="demo-content-push-stack" @click="pushStackCard">
                push stackCard.push('/cache-state')
            </button>
        </div>

        <div v-if="message" class="Message" data-testid="demo-content-message">{{ message }}</div>
    </div>
</template>

<script setup>
import {ref} from 'vue';
import {useRouter} from 'vue-router';
import {usePresenter} from 'layerge';

import EntryInfo from './EntryInfo.vue';
import ModalOpenContent from './ModalOpenContent.vue';

const router = useRouter();
const presenter = usePresenter();
const message = ref('');

const close = () => {
    presenter.handle.close();
};

const openNestedModal = () => {
    message.value = 'opened nested modal';
    router.modal.open(ModalOpenContent);
};

const pushStackCard = () => {
    message.value = 'pushed stackCard';
    router.stackCard.push('/cache-state');
};
</script>

<style scoped>
.Root {
    display: grid;
    gap: 10px;
}

.Title {
    margin: 0;
    font-size: 16px;
}

.Help {
    margin: 0;
    font-size: 12px;
    color: #444;
}

.Buttons {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
}

.Btn {
    padding: 6px 10px;
    cursor: pointer;
    background: white;
    border: 1px solid #ccc;
    border-radius: 8px;
}

.Message {
    padding: 8px 10px;
    font-size: 12px;
    color: #333;
    background: #fff7ed;
    border: 1px solid #fed7aa;
    border-radius: 10px;
}
</style>
