<template>
    <div class="NotFoundRoot">
        <h1 class="Title">Not Found</h1>
        <p class="Desc">
            This route is a demo catch-all. It exists to prevent a blank screen when you refresh on an
            unmatched
            <code>fakePath</code>
            .
        </p>

        <div class="Box">
            <div>current URL:</div>
            <code data-testid="notfound-url">{{ currentUrl }}</code>
        </div>

        <div class="Box">
            <div class="HelpTitle">Why this matters</div>
            <ul class="List">
                <li>
                    <code>push(Component|loader, {fakePath})</code>
                    updates the URL to
                    <code>fakePath</code>
                    .
                </li>
                <li>If your app has no route for that path, a full refresh may show nothing.</li>
                <li>
                    A catch-all route lets you show a friendly page or implement your own restoration
                    strategy.
                </li>
            </ul>
        </div>

        <button type="button" class="Btn" @click="goHome">Go Home</button>
    </div>
</template>

<script setup>
import {computed} from 'vue';
import {useRoute, useRouter} from 'vue-router';

const router = useRouter();
const route = useRoute();

const currentUrl = computed(() => {
    return route.fullPath;
});

const goHome = () => {
    router.replace('/');
};
</script>

<style scoped>
.NotFoundRoot {
    padding: 16px;
    font-family:
        system-ui,
        -apple-system,
        'Segoe UI',
        Roboto,
        sans-serif;
}

.Title {
    margin: 0 0 10px;
    font-size: 20px;
}

.Desc {
    margin: 0 0 14px;
    color: #333;
}

.Box {
    margin-top: 12px;
    padding: 12px;
    background: #f6f7f9;
    border: 1px solid #e5e7eb;
    border-radius: 10px;
}

.HelpTitle {
    margin-bottom: 8px;
    font-weight: 700;
}

.List {
    margin: 0;
    padding-left: 18px;
}

.Btn {
    margin-top: 14px;
    padding: 8px 10px;
    cursor: pointer;
    background: white;
    border: 1px solid #ccc;
    border-radius: 8px;
}

code {
    padding: 2px 4px;
    background: #fff;
    border: 1px solid #e5e7eb;
    border-radius: 6px;
}
</style>
