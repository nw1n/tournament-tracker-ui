<script setup>
import { useTournamentStore } from '@/stores/main'
import { useUiStore } from '@/stores/ui'
import { millisecondsToTime } from '../lib/Util'
import { onMounted, onUnmounted } from 'vue'
import { set } from 'lodash'

const tournament = useTournamentStore()
const uiStore = useUiStore()

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

const updateTimeRemaining = () => {
    const roundTime = uiStore.roundTimeLength
    const timePassed = tournament.timePassedSinceStartOfCurrentRound(tournament.roundNr)
    const timeRemainingMs = roundTime - timePassed

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

const saveDataToSerer = () => {
    console.log('saving data to server')
    const hostUrl = 'http://localhost:5000/'
    const url = hostUrl + 'save-tournament/'
    fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            tournament: JSON.stringify(tournament.matches),
        }),
    })
        .then((response) => response.json())
        .then((data) => {
            console.log('Success:', data)
        })
        .catch((error) => {
            console.error('Error:', error)
        })
}

const endTournament = () => {
    tournament.endRound()
    saveDataToSerer()
    navigateTo('/end')
}

const ignoreRoundAndEndTournament = () => {
    saveDataToSerer()
    navigateTo('/end')
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
                    <div>Started {{ tournament.timeRoundStarted(tournament.roundNr) }}</div>
                    <!-- <div>
                        Time Passed:
                        {{ millisecondsToTime(tournament.timePassedSinceStartOfCurrentRound(tournament.roundNr)) }}
                    </div> -->
                    <div>
                        Round Length:
                        {{ millisecondsToTime(uiStore.roundTimeLength) }}
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
                    :class="`${tournament.isBuyMatch(match) ? 'is-buy-match-scores' : 'is-non-buy-match-scores'} round-matches-scores gap-4 flex mt-12`"
                >
                    <div class="w-24 player-section">
                        <div class="player-name">{{ match.player1 }}</div>
                        <div class="player-score">{{ match.score1 }}</div>

                        <div v-if="!tournament.isBuyMatch(match) && match.round === tournament.roundNr">
                            <button @click="tournament.increaseScore(tournament.roundNr, match.player1)">+</button>
                            <button @click="tournament.increaseScore(tournament.roundNr, match.player1, -1)">-</button>
                        </div>
                    </div>
                    <div class="w-16">-----</div>
                    <div class="w-24 player-section">
                        <div class="player-name">{{ match.player2 }}</div>
                        <div class="player-score">{{ match.score2 }}</div>

                        <div v-if="!tournament.isBuyMatch(match) && match.round === tournament.roundNr">
                            <button @click="tournament.increaseScore(tournament.roundNr, match.player2)">+</button>
                            <button @click="tournament.increaseScore(tournament.roundNr, match.player2, -1)">-</button>
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
