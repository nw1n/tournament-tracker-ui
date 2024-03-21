<script setup>
import { useTournamentStore } from '@/stores/main'

definePageMeta({
    layout: 'full',
})

const tournament = useTournamentStore()

const startTournament = async () => {
    tournament.endAndReset()
    tournament.init()
    await navigateTo('/players')
}
</script>

<template>
    <div id="start-page" class="flex min-w-full min-h-screen">
        <div class="m-auto pb-32">
            <div class="mt-12">
                <button
                    id="start-button"
                    @click="startTournament"
                    class="border bg-sky-700 text-white p-2 hover:bg-sky-400 text-2xl"
                >
                    Start tournament
                </button>
            </div>
        </div>
    </div>
</template>

<style scoped>
#start-page {
    background-image: url('/images/karakas-cover.jpg');
    background-position: center;
    background-repeat: no-repeat;
    background-size: cover;
}
#start-button {
    box-shadow: 0 0 60px 10px rgba(0, 0, 0, 0.3);
}
</style>
