<script setup>
import { useTournamentStore } from '@/stores/main'
import { getRandomName } from '@/lib/getRandomName'

const tournament = useTournamentStore()

const errorMessage = ref('')
const newPlayer = ref('')
const inputLabel = ref(null)
const addPlayer = () => {
    if (!newPlayer.value || newPlayer.value.trim() === '') {
        errorMessage.value = 'Player name is required'
        return
    }
    if (tournament.isPlayerExists(newPlayer.value)) {
        errorMessage.value = 'Player already exists'
        return
    }
    errorMessage.value = ''
    tournament.addPlayer(newPlayer.value.trim())
    newPlayer.value = ''
    inputLabel.value.focus()
}

const addRandomPlayers = (x) => {
    for (let i = 0; i < x; i++) {
        const playerName = getRandomName(tournament.players.slice())
        if (playerName && !tournament.isPlayerExists(playerName)) {
            tournament.addPlayer(playerName)
        }
    }
}

const add12randomPlayers = () => {
    addRandomPlayers(12)
}

const add1randomPlayer = () => {
    addRandomPlayers(1)
}

const startTournament = async () => {
    if (tournament.players.length < 2) {
        errorMessage.value = 'At least 2 players are required'
        return
    }
    tournament.createMatchesForRoundWithNoRepeats(tournament.roundNr)
    await navigateTo('/round')
}

const continueTournament = () => {
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
                <button @click="add1randomPlayer" id="add-1-random-player-btn" class="mt-2 bg-green-600 text-white">
                    Add 1 random player
                </button>
                <button @click="add12randomPlayers" id="add-12-random-players-btn" class="mt-2 bg-green-600 text-white">
                    Add 12 random players
                </button>
            </div>
            <div v-if="tournament.isTournamentInProgress" class="mt-12">
                <button @click="continueTournament" id="continue-tournament-btn">Continue tournament</button>
            </div>
            <div v-else class="mt-12">
                <button @click="startTournament" id="finish-player-creation-btn">Start tournament</button>
            </div>
        </div>
    </div>
</template>
<style scoped>
.input-area.has-error input#player {
    background-color: #ffcccc;
}
</style>
