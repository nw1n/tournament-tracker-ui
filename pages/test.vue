<script setup lang="ts">
import { useTournamentStore } from '~/stores/tournament'
import _ from 'lodash'
import { unProxy } from '~/lib/Util.js'

const tournament = useTournamentStore()

const startTests = async () => {
    tournament.endAndReset()
    tournament.init()

    const players = ['Spieler Eins', 'Spieler Zwei', 'Spieler Drei', 'Spieler Vier']
    players.forEach((player: string) => {
        tournament.addPlayer(player)
    })

    const dateNowInt = new Date().getTime()
    tournament.matches = [
        {
            round: 1,
            dateStarted: dateNowInt,
            player1: 'Spieler Eins',
            player2: 'Spieler Zwei',
            score1: 2,
            score2: 0,
            tournamentId: dateNowInt,
        },
        {
            round: 1,
            dateStarted: dateNowInt,
            player1: 'Spieler Drei',
            player2: 'Spieler Vier',
            score1: 1,
            score2: 1,
            tournamentId: dateNowInt,
        },
    ]

    tournament.endRound()
    tournament.incrementRoundNr()
    tournament.addPlayer('Spieler Fünf')
    tournament.createMatchesForRound()
    tournament.endRound()

    for (let i = 0; i < 4; i++) {
        tournament.endRoundAndCreateNewMatches()
    }

    console.log(unProxy(tournament.allTournamentScoresSorted))
    console.log(unProxy(tournament.$state.matches))
}
</script>

<template>
    <div class="pt-16 text-sm">
        <div class="fixed top-0">
            <button
                id="start-button"
                @click="startTests"
                class="border bg-sky-700 text-white p-2 hover:bg-sky-400 text-2xl"
            >
                Start Tests
            </button>
        </div>
        <div>
            <pre v-for="(item, index) in tournament.$state.matches" :key="index">
                {{ JSON.stringify(item, null, 2) }}
            </pre>
            <h4>Tournamet Scores</h4>
            <pre v-for="(item, index) in tournament.allTournamentScoresSorted">
                {{ JSON.stringify(item, null, 2) }}
            </pre>
            <h4>Bye Ratios</h4>
            <pre>
                {{ JSON.stringify(tournament.byeRatios, null, 2) }}
            </pre>
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
