<script setup lang="ts">
import { useTournamentStore } from '~/stores/tournament'
import { useSettingsStore } from '~/stores/settings'
import { getRandomName } from '~/lib/getRandomNameForTesting'
import { Config } from '@/lib/Config'

const tournament = useTournamentStore()
const settings = useSettingsStore()

const errorMessage = ref('')
const newPlayer = ref('')
const inputLabel = ref<HTMLElement | null>(null)

function addPlayer() {
    const newPlayerName = newPlayer.value.trim()
    if (!newPlayer.value || newPlayerName === '') {
        errorMessage.value = 'Player name is required'
        return
    }
    if (tournament.players.includes(newPlayerName)) {
        errorMessage.value = 'Player already exists'
        return
    }
    errorMessage.value = ''
    tournament.addPlayer(newPlayerName)
    newPlayer.value = ''
    if (inputLabel.value) {
        inputLabel.value.focus()
    }
}

function addRandomPlayers(x: number) {
    for (let i = 0; i < x; i++) {
        const playerName = getRandomName(tournament.players.slice())
        if (playerName && !tournament.players.includes(playerName)) {
            tournament.addPlayer(playerName)
        }
    }
}

function add12randomPlayers() {
    addRandomPlayers(12)
}

function add1randomPlayer() {
    addRandomPlayers(1)
}

async function startTournament() {
    if (newPlayer.value.trim()) {
        errorMessage.value = 'Did you forget to add the player? Please press "add  player" or empty the input field.'
        return
    }
    if (tournament.players.length < 2) {
        errorMessage.value = 'At least 2 players are required'
        return
    }
    tournament.createMatchesForRound()
    await navigateTo('/round')
}

function continueTournament() {
    if (newPlayer.value.trim()) {
        errorMessage.value = 'Did you forget to add the player? Please press add or empty the input field.'
        return
    }
    navigateTo('/round')
}
</script>

<template>
    <div class="">
        <div class="">
            <div id="list-of-predefined-player">
                <h1 class="mb-8">Predefined Players</h1>
                <div v-for="(player, index) in settings.predefinedPlayers" :key="player">
                    <div>
                        <button
                            :class="`${tournament.players.includes(player) ? 'bg-blue-400' : ''} player-name flex justify-between block w-full`"
                            @click="
                                tournament.players.includes(player)
                                    ? tournament.removePlayer(player)
                                    : tournament.addPlayer(player)
                            "
                        >
                            {{ player }}
                        </button>
                    </div>
                </div>
            </div>
            <div id="list-of-created-players">
                <h1 class="mb-8">Players</h1>
                <div v-for="(player, index) in tournament.players" :key="player">
                    <p class="player-name flex justify-between">
                        {{ player }}
                        <button
                            class="delete-player-btn bg-red-500 text-white"
                            @click="tournament.removePlayer(player)"
                        >
                            x
                        </button>
                    </p>
                </div>
            </div>
            <div :class="`input-area ${errorMessage ? 'has-error' : ''}`">
                <label for="player">Add Player</label>
                <input
                    type="text"
                    id="player"
                    ref="inputLabel"
                    v-model="newPlayer"
                    placeholder="Player Name"
                    @keydown.enter="addPlayer"
                    class="border p-2 bg-slate-100 mt-2 mx-2"
                />
                <div class="text-red-500">{{ errorMessage }}</div>
                <button @click="addPlayer" id="add-player-btn" class="mt-2 bg-green-600 text-white">Add player</button>
                <template v-if="Config.getInstance().isDevMode">
                    <button @click="add1randomPlayer" id="add-1-random-player-btn" class="mt-2 bg-green-600 text-white">
                        Add 1 random player
                    </button>
                    <button
                        @click="add12randomPlayers"
                        id="add-12-random-players-btn"
                        class="mt-2 bg-green-600 text-white"
                    >
                        Add 12 random players
                    </button>
                </template>
            </div>
            <div class="mt-8 mb-8">Number of players: {{ tournament.players.length }}</div>
            <div v-if="tournament.isTournamentInProgress">
                <button @click="continueTournament" id="continue-tournament-btn">Continue tournament</button>
            </div>
            <div v-else>
                <button @click="startTournament" id="finish-player-creation-btn">Start tournament</button>
            </div>
            <div id="list-of-bye.excluded-players" class="mt-48">
                <h1 class="mb-8">Protect players from BYE</h1>
                <div v-for="(player, index) in tournament.players" :key="player">
                    <div>
                        <button
                            :class="`${tournament.playersExcludedFromBye.includes(player) ? 'bg-blue-400' : ''} player-name flex justify-between block w-full`"
                            @click="
                                tournament.playersExcludedFromBye.includes(player)
                                    ? tournament.removePlayerExcludedFromBye(player)
                                    : tournament.addPlayerExcludedFromBye(player)
                            "
                        >
                            {{ player }}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
<style scoped>
.input-area.has-error input#player {
    background-color: #ffcccc;
}
</style>
