<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { useTournamentStore } from '~/stores/tournament'
import { ServerApi } from '@/lib/ServerApi'

definePageMeta({
    layout: 'debug',
})

onMounted(() => {
    console.log('mounted')
    const fetchData = async () => {
        const data = await ServerApi.getInstance().fetchTestServerData()
        console.log(data)
    }
    fetchData()
})

const tournament = useTournamentStore()
</script>

<template>
    <div>
        <h1>Me Index Page</h1>
        <div v-if="tournament.isTournamentActive">
            <h2>Current Tournament</h2>
            <p>Round: {{ tournament.roundNr }}</p>
            <p>ID: {{ tournament.id }}</p>
            <h3>Players</h3>
            <div v-for="(player, index) in tournament.players" :key="player">
                <p>{{ player }}</p>
            </div>
            <h3>Tournament Scores</h3>
            <div>
                <div v-for="(scoreItem, index) in tournament.allTournamentScores" :key="index">
                    <p>{{ scoreItem.player }}: {{ scoreItem.score }}</p>
                </div>
            </div>
            <h3>Matches</h3>
            <div class="overflow-x-auto flex gap-4">
                <div
                    class="flex gap-4 flex-col border p-2"
                    v-for="(dummyVal, roundIndex) in Array(tournament.roundNr).fill('x')"
                >
                    <h4>Round {{ roundIndex + 1 }}<br />(Start: {{ tournament.timeRoundStarted(roundIndex + 1) }})</h4>
                    <div
                        v-for="(match, matchIndex) in tournament.matchesByRound(roundIndex + 1)"
                        :key="matchIndex"
                        class="gap-4 flex"
                    >
                        <div class="w-24">
                            <div>{{ match.player1 }}</div>
                            <div>{{ match.score1 }}</div>

                            <div v-if="!(match.player2 === 'BYE') && match.round === tournament.roundNr">
                                <button @click="tournament.changeScore(tournament.roundNr, match.player1, 1)">
                                    Score++
                                </button>
                                <button @click="tournament.changeScore(tournament.roundNr, match.player1, -1)">
                                    Score--
                                </button>
                            </div>
                        </div>
                        <div class="w-16">-----</div>
                        <div class="w-24">
                            <div>{{ match.player2 }}</div>
                            <div>{{ match.score2 }}</div>

                            <div v-if="!(match.player2 === 'BYE') && match.round === tournament.roundNr">
                                <button @click="tournament.changeScore(tournament.roundNr, match.player2, 1)">
                                    Score++
                                </button>
                                <button @click="tournament.changeScore(tournament.roundNr, match.player2, -1)">
                                    Score--
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
