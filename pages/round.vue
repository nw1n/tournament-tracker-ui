<script setup lang="ts">
import { useTournamentStore, type Match } from '~/stores/tournament'
import { useSettingsStore } from '@/stores/settings'
import { log, millisecondsToTime, sleep } from '../lib/Util'
import { onMounted, onUnmounted } from 'vue'
import { ServerApi } from '~/lib/ServerApi'

const tournament = useTournamentStore()
const settings = useSettingsStore()

const isEndRoundMenuOpen = ref(false)
const timeRemaining = ref('00:00')
const timerColorVal = ref('inherit')
const dateStarted = ref(0)
const isPaused = ref(false)
const totalTimePaused = ref(0)

let timerIdentifier: any = null

onMounted(() => {
    updateDateStarted()
    initTimerRender()
})

onUnmounted(() => {
    clearTimerInterval()
})

function clearTimerInterval() {
    if (timerIdentifier) {
        try {
            clearInterval(timerIdentifier)
        } catch (e) {
            console.log(e)
        }
    }
}

function pauseTimer() {
    isPaused.value = true
}

function unPauseTimer() {
    isPaused.value = false
    initTimerRender()
}

function updateDateStarted() {
    const matches = tournament.matches
    const roundNr = tournament.roundNr
    const match = matches.find((m) => m.round === roundNr)
    if (!match || !match.dateStarted) {
        console.log('no match or dateStarted found for round', roundNr, match)
        return 0
    }
    const result = match.dateStarted
    console.log(result)
    dateStarted.value = result
    return result
}

function updateTimeRemaining() {
    const timePassed = Date.now() - dateStarted.value
    const timeRemainingMs = settings.roundTimeInMilliSeconds - timePassed
    timeRemaining.value = millisecondsToTime(timeRemainingMs)

    if (isPaused.value === true) {
        console.log('is paused')
    }

    if (timeRemainingMs < 1) {
        timerColorVal.value = '#ff5555'
        clearTimerInterval()
        return
    }
}

async function initTimerRender() {
    clearTimerInterval()
    updateTimeRemaining()
    timerIdentifier = setInterval(updateTimeRemaining, 1000)
}

function initRoundEnd() {
    isEndRoundMenuOpen.value = true
}

function endRound() {
    isEndRoundMenuOpen.value = false
    tournament.endRoundAndCreateNewMatches()
    window.scrollTo({
        top: 0,
        behavior: 'instant',
    })
    initTimerRender()
}

async function saveDataToServer() {
    log('saving data to server')
    const result = await ServerApi.getInstance().postTournamentData(tournament.finishedMatches)
    log('result', result)
}

function endTournament() {
    tournament.endRound()
    log(JSON.parse(JSON.stringify(tournament.finishedMatches)))
    saveDataToServer()
    navigateTo('/end')
}

function ignoreRoundAndEndTournament() {
    log(JSON.parse(JSON.stringify(tournament.finishedMatches)))
    saveDataToServer()
    navigateTo('/end')
}

function changePlayers() {
    navigateTo('/players')
}
</script>

<template>
    <div id="tournament-round" class="">
        <div class="">
            <div class="overflow-x-auto">
                <h3>
                    Round <strong>{{ tournament.roundNr }}</strong>
                </h3>
                <div class="text-xs text-gray-600 mt-2">
                    <div>Round started at: {{ tournament.timeCurrentRoundStarted }}</div>
                    <div>
                        Round Length:
                        {{ settings.roundTimeMinutes }}:00
                    </div>
                    <div class="pt-6">
                        Time Remaining:
                        <div class="pt-2 pb-4 flex justify-between items-end">
                            <span id="timer-time" class="text-5xl min-w-36" :style="{ color: timerColorVal }">{{
                                timeRemaining
                            }}</span>
                            <button @click="updateTimeRemaining">update time</button>
                        </div>
                    </div>
                </div>
                <div
                    v-for="(match, matchIndex) in tournament.matchesByRound(tournament.roundNr)"
                    :key="matchIndex"
                    :class="`${match.player2 === 'BYE' ? 'is-buy-match-scores' : 'is-non-buy-match-scores'} round-matches-scores gap-4 flex mt-12`"
                >
                    <div class="w-24 player-section">
                        <div class="player-name">{{ match.player1 }}</div>
                        <div class="player-score">{{ match.score1 }}</div>

                        <div v-if="!(match.player2 === 'BYE') && match.round === tournament.roundNr">
                            <button @click="tournament.changeScore(tournament.roundNr, match.player1, 1)">+</button>
                            <button @click="tournament.changeScore(tournament.roundNr, match.player1, -1)">-</button>
                        </div>
                    </div>
                    <div class="w-16">-----</div>
                    <div class="w-24 player-section">
                        <div class="player-name">{{ match.player2 }}</div>
                        <div class="player-score">{{ match.score2 }}</div>

                        <div v-if="!(match.player2 === 'BYE') && match.round === tournament.roundNr">
                            <button @click="tournament.changeScore(tournament.roundNr, match.player2, 1)">+</button>
                            <button @click="tournament.changeScore(tournament.roundNr, match.player2, -1)">-</button>
                        </div>
                    </div>
                </div>
            </div>
            <div class="mt-12">
                <div v-if="!isEndRoundMenuOpen">
                    <button @click="initRoundEnd" class="border bg-sky-700 text-white p-2 hover:bg-sky-400 text-2xl">
                        End Round
                    </button>
                </div>
                <div v-if="isEndRoundMenuOpen" class="flex flex-col">
                    <button @click="endRound" class="">Start new round</button>
                    <button @click="endTournament" class="mt-16">End this round and end Tournament</button>
                    <button @click="ignoreRoundAndEndTournament" class="mt-16">
                        Cancel this round and end Tournament
                    </button>
                </div>
            </div>
            <div class="mt-24">
                <button @click="changePlayers" class="">Change Players</button>
            </div>
        </div>
    </div>
</template>
<style scoped>
#timer-time {
    transition: color 200ms;
}
.player-section button {
    @apply text-4xl mt-2 mr-2 w-10;
}
</style>
```
