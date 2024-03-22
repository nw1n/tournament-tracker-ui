<script setup>
import { useTournamentStore } from '@/stores/main'
const tournament = useTournamentStore()

const nav = [
    { name: 'Start', path: '/' },
    { name: 'Settings', path: '/settings' },
    { name: 'Debug', path: '/debug' },
    { name: 'Players', path: '/players' },
    { name: 'Round', path: '/round' },
    { name: 'Test', path: '/test' },
]
</script>

<template>
    <div class="py-2 bg-gray-300">
        <p>This is for testing cypress.</p>
        <nav class="flex gap-2 flex-wrap mb-4">
            <NuxtLink
                v-for="link in nav"
                :key="link.path"
                :to="link.path"
                class="border bg-sky-700 text-white p-2 hover:bg-sky-400"
                >{{ link.name }}</NuxtLink
            >
        </nav>
        <div id="debug" class="flex gap-2 flex-wrap">
            <button @click="tournament.init()">Init Tournament</button>
            <button @click="tournament.endAndReset()">End Tournament</button>
            <button @click="tournament.createMatchesForRoundWithNoRepeats(tournament.roundNr)">
                Create First Round Matches
            </button>
            <button @click="tournament.endRoundAndCreateNewMatches()">End Round</button>
        </div>
    </div>
</template>
