<template>
    <div class="container py-12 stack">
        <div class="rich-text stack">
            <strong>Error</strong>
        </div>
        <div class="rich-text stack">An error happened.</div>
    </div>
</template>

<script>
export default {
    layout: 'default',
    props: {
        error: {
            type: Object,
            default: null,
        },
    },
}
</script>

<style></style>
