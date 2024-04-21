import { defineStore } from 'pinia'
import { formatTime, insertionSortObjs, log } from '~/lib/Util'
import _ from 'lodash'
import { changeScore, getAllTournamentScores } from '~/lib/TournamentStoreFn'
import { MatchMaker } from '~/lib/MatchMaker'

export interface Match {
    round: number
    player1: string
    player2: string
    score1: number
    score2: number
    dateStarted: number
    tournamentId: number
}

export interface TournamentState {
    roundNr: number
    finishedRoundNr: number
    players: string[]
    startDate?: Date
    id: number
    matches: Match[]
}

export interface TournamentStateExtended extends TournamentState {
    $state: TournamentState
}

export const useTournamentStore = defineStore('tournament', {
    persist: {
        storage: persistedState.localStorage,
    },

    state: (): TournamentState => ({
        roundNr: 0,
        finishedRoundNr: 0,
        players: [],
        startDate: undefined,
        id: 0,
        matches: [],
    }),

    actions: {
        reset() {
            this.roundNr = 0
            this.finishedRoundNr = 0
            this.players = []
            this.startDate = undefined
            this.id = 0
            this.matches = []
        },

        init() {
            log('Initializing tournament')
            this.reset()
            this.roundNr = 1
            this.startDate = new Date()
            this.id = this.startDate.getTime()
        },

        createMatchesForRound() {
            const matchMaker = new MatchMaker(this)

            const newMatches = matchMaker.playerPairs.map((pair) => ({
                round: this.roundNr,
                player1: pair[0],
                player2: pair[1],
                score1: pair[1] === 'BYE' ? 9 : 0,
                score2: 0,
                dateStarted: Date.now(),
                tournamentId: this.id,
            }))

            this.matches = this.matches.concat(newMatches)
        },

        endAndReset() {
            this.reset()
        },

        addPlayer(player: string) {
            this.players.push(player)
        },

        removePlayer(player: string) {
            this.players = this.players.filter((p) => p !== player)
        },

        resetPlayers() {
            this.players = []
        },

        endRound() {
            this.finishedRoundNr = this.roundNr
        },

        incrementRoundNr() {
            this.roundNr++
        },

        endRoundAndCreateNewMatches() {
            this.endRound()
            this.incrementRoundNr()
            this.createMatchesForRound()
        },

        changeScore(round: number, player: string, scoreChange: number) {
            changeScore(this, round, player, scoreChange)
        },
    },

    getters: {
        isTournamentActive(state): boolean {
            return state.roundNr > 0
        },

        isTournamentInProgress(state): boolean {
            return state.matches.length > 0
        },

        allTournamentScoresSorted(state): any[] {
            return getAllTournamentScores(state)
        },

        timeCurrentRoundStarted(state): string | undefined {
            return this.timeRoundStarted(state.roundNr)
        },

        finishedMatches(state): Match[] {
            return state.matches.filter((m: Match) => m.round <= state.finishedRoundNr)
        },

        // getters with argument
        // ------------------------------------------------------------------

        matchesByRound(state): (round: number) => Match[] {
            return (round: number) => state.matches.filter((m) => m.round === round)
        },

        timeRoundStarted(state): (round: number) => string | undefined {
            return (round: number) => {
                const match = state.matches.find((m) => m.round === round)
                if (!match || !match.dateStarted) {
                    return undefined
                }
                return formatTime(match.dateStarted)
            }
        },
    },
})
