<script setup>
import AppNav from '@/components/AppNav.vue'
</script>

<template>
    <div class="max-w-screen-xl mx-auto px-4 py-6">
        <AppNav />
        <main>
            <slot></slot>
        </main>
    </div>
</template>
<style>
button {
    @apply border-slate-300 border-2 bg-slate-100 p-2;
}
h1,
h2,
h3,
h4,
h5,
h6,
p {
    @apply mt-2 mb-2;
}
h1 {
    @apply text-4xl mt-8;
}
h2 {
    @apply text-3xl mt-6;
}
h3 {
    @apply text-2xl mt-4;
}
h4 {
    @apply text-xl;
}
</style>
