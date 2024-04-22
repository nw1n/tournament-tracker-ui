<script setup lang="ts">
import { useTournamentStore } from '~/stores/tournament'

const tournament = useTournamentStore()
</script>

<template>
    <div id="end-page" class="">
        <div class="">
            <h1>Tournament finished</h1>
            <div>
                <h3>Final Scores</h3>
                <ol class="list-decimal">
                    <li v-for="(scoreItem, index) in tournament.allTournamentScoresSorted" :key="index">
                        <p>{{ scoreItem.player }}: {{ scoreItem.score }} Points</p>
                    </li>
                </ol>
            </div>
            <div class="mt-12">
                <NuxtLink to="/" class="border bg-sky-700 text-white p-2 hover:bg-sky-400 text-2xl">Restart </NuxtLink>
            </div>
        </div>
    </div>
</template>

<style scoped></style>
