<script setup lang="ts">
import { useTournamentStore } from '~/stores/tournament'
import { useSettingsStore } from '@/stores/settings'
import { log, millisecondsToTime } from '../lib/Util'
import { onMounted, onUnmounted } from 'vue'
import { ServerApi } from '~/lib/ServerApi'

const tournament = useTournamentStore()
const settings = useSettingsStore()

const isEndRoundMenuOpen = ref(false)

const timeRemaining = ref('00:00')

const timerColorVal = ref('inherit')

let timer = null

const clearTimerInterval = () => {
    if (timer) {
        try {
            clearInterval(timer)
        } catch (e) {
            console.log(e)
        }
    }
}

function getTimePassedSinceStartOfCurrentRound(matches, roundNr) {
    const match = matches.find((m) => m.round === roundNr)
    if (!match || !match.dateStarted) {
        console.log('no match or dateStarted found for round', roundNr, match)
        return 0
    }
    const currentTime = new Date()
    const matchDateStarted = new Date(match.dateStarted)
    return currentTime.getTime() - matchDateStarted.getTime()
}

const updateTimeRemaining = () => {
    const timePassed = getTimePassedSinceStartOfCurrentRound(tournament.matches, tournament.roundNr)
    const timeRemainingMs = settings.roundTimeInMilliSeconds - timePassed

    if (timeRemainingMs < 0) {
        timeRemaining.value = '00:00'
        timerColorVal.value = '#ff5555'
        clearTimerInterval()
        return
    }

    timeRemaining.value = millisecondsToTime(timeRemainingMs)
    timerColorVal.value = '#888'
    setTimeout(() => {
        timerColorVal.value = 'inherit'
    }, 200)
}

const initTimerRender = () => {
    clearTimerInterval()
    updateTimeRemaining()
    setTimeout(updateTimeRemaining, 1000)
    setTimeout(updateTimeRemaining, 2000)
    setTimeout(updateTimeRemaining, 3000)
    timer = setInterval(updateTimeRemaining, 10000)
}

onMounted(() => {
    console.log(`the round component is now mounted.`)
    initTimerRender()
})

onUnmounted(() => {
    console.log(`the round component is now unmounted.`)
    clearTimerInterval()
})

const initRoundEnd = () => {
    isEndRoundMenuOpen.value = true
}

const endRound = () => {
    isEndRoundMenuOpen.value = false
    tournament.endRoundAndCreateNewMatches()
    window.scrollTo({
        top: 0,
        behavior: 'instant',
    })
    initTimerRender()
}

const saveDataToServer = async () => {
    log('saving data to server')
    const result = await ServerApi.getInstance().postTournamentData(tournament.finishedMatches)
    log('result', result)
}

const endTournament = () => {
    tournament.endRound()
    saveDataToServer()
    navigateTo('/end')
}

const ignoreRoundAndEndTournament = () => {
    saveDataToServer()
    navigateTo('/end')
}

const changePlayers = () => {
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
                    <div>Started {{ tournament.timeCurrentRoundStarted }}</div>
                    <div>
                        Round Length:
                        {{ millisecondsToTime(settings.roundTimeMinutes) }}
                    </div>
                    <div class="pt-6">
                        Time Remaining:
                        <div class="pt-2 pb-4">
                            <span id="timer-time" class="text-6xl mr-8" :style="{ color: timerColorVal }">{{
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
