<template>
    <div data-testid="fakepath-content">
        <h3>FakePath Content</h3>
        <p>
            This component is opened via
            <code>push(Component, {url})</code>
            . The URL may point to a path that is not registered as a route.
        </p>
        <p>
            Current URL:
            <code data-testid="current-url">{{ currentUrl }}</code>
        </p>
    </div>
</template>

<script setup>
import {computed} from 'vue';
import {useRoute} from 'vue-router';

const route = useRoute();
const currentUrl = computed(() => {
    return route.fullPath;
});
</script>

<style scoped>
h3 {
    margin: 0 0 8px;
}

code {
    padding: 2px 4px;
    background: #f3f4f6;
    border-radius: 4px;
}
</style>
