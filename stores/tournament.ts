import { defineStore } from 'pinia'
import { formatTime, log } from '~/lib/Util'
import _ from 'lodash'
import {
    getAllTournamentScores,
    getByeRatiosSorted,
    insertionSortObjs,
    ActionFns as TournamentStoreActions,
} from '~/lib/TournamentStoreFn'

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

        nextRound() {
            this.roundNr++
        },

        endRoundAndNextRound() {
            this.endRound()
            this.nextRound()
        },

        createMatchesForRound() {
            TournamentStoreActions.createMatchesForRound(this, this.roundNr)
        },

        endRoundAndCreateNewMatches() {
            this.endRoundAndNextRound()
            this.createMatchesForRound()
        },

        changeScore(round: number, player: string, scoreChange: number) {
            TournamentStoreActions.changeScore(this, round, player, scoreChange)
        },

        // Action getters
        // ------------------------------------------------------------------
        getTimePassedSinceStartOfCurrentRound(): number {
            const state = this
            const match = state.matches.find((m) => m.round === state.roundNr)
            if (!match || !match.dateStarted) {
                log('no match or dateStarted found for round', state.roundNr, match)
                return 0
            }
            const currentTime = new Date()
            const matchDateStarted = new Date(match.dateStarted)
            return currentTime.getTime() - matchDateStarted.getTime()
        },
    },

    getters: {
        isTournamentActive(state): boolean {
            return state.roundNr > 0
        },

        isTournamentInProgress(state): boolean {
            return state.matches.length > 0
        },
        // isBuyMatch: (state) => (match: Match) => {
        //     return match.player2 === 'BYE' || match.player1 === 'BYE'
        // },
        allTournamentScores: (state) => {
            console.log('allTournamentScores')
            return getAllTournamentScores(state)
        },
        allTournamentScoresSorted: (state) => {
            const scores = getAllTournamentScores(state)
            return insertionSortObjs(scores, 'score').reverse()
        },
        isPlayerExists: (state) => (player: string) => state.players.includes(player),
        byeRatios: (state) => {
            return getByeRatiosSorted(state)
        },
        timeRoundStarted: (state) => (round: number) => {
            const match = state.matches.find((m) => m.round === round)
            if (!match || !match.dateStarted) {
                return undefined
            }
            return formatTime(match.dateStarted)
        },
        finishedMatches(state): Match[] {
            return state.matches.filter((m: Match) => m.round <= state.finishedRoundNr)
        },

        // getters with argument
        // ------------------------------------------------------------------
        isBuyMatch(state): (match: Match) => boolean {
            return (match: Match) => {
                return match.player2 === 'BYE' || match.player1 === 'BYE'
            }
        },

        matchesByRound(state): (round: number) => Match[] {
            return (round: number) => state.matches.filter((m) => m.round === round)
        },
    },
})
