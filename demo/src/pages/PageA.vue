<template>
    <PageShell title="Page A">
        <div class="Block">
            <p class="Help">
                Buttons here are used by E2E to validate
                <code>replace()</code>
                +
                <code>fakePath</code>
                .
            </p>
            <button type="button" class="Btn" data-testid="modal-replace-fakepath" @click="replaceFakePath">
                modal.replace(Component, {fakePath:'/fake/replace'})
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

const replaceFakePath = () => {
    lastAction.value = "modal.replace(Component, {fakePath:'/fake/replace'})";
    lastResult.value = '';
    trackNavigation(lastAction.value, '/fake/replace');
    router.modal.replace(ModalOpenContent, {fakePath: '/fake/replace'});
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
