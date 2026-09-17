<template>
    <div class="PageShell">
        <h1>{{ title }}</h1>
        <div class="Body">
            <slot />
        </div>
    </div>
</template>

<script setup>
defineProps({
    title: {
        type: String,
        required: true
    }
});
</script>

<style scoped>
.PageShell {
    padding: 24px;
}

.Body {
    margin-top: 12px;
}
</style>
