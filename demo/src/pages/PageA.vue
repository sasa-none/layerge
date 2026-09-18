<template>
    <PageShell title="Page A">
        <div class="Block">
            <p class="Help">
                Buttons here are used by E2E to validate
                <code>replace()</code>
                +
                <code>url</code>
                .
            </p>
            <button type="button" class="Btn" data-testid="modal-replace-url" @click="replaceWithUrl">
                modal.replace(Component, {url:'/no-route/replace'})
            </button>
        </div>
    </PageShell>
</template>

<script setup>
import {useRouter} from 'vue-router';
import {trackNavigation, lastAction, lastResult} from '../navLog';
import ModalOpenContent from '../components/ModalOpenContent.vue';
import PageShell from './_PageShell.vue';

const router = useRouter();

const replaceWithUrl = () => {
    lastAction.value = "modal.replace(Component, {url:'/no-route/replace'})";
    lastResult.value = '';
    trackNavigation(lastAction.value, '/no-route/replace');
    router.modal.replace(ModalOpenContent, {url: '/no-route/replace'});
};
</script>

<style scoped>
.Block {
    padding: 16px;
}

.Help {
    margin: 0 0 8px;
}

.Btn {
    padding: 8px 12px;
}
</style>
