import _ from 'lodash'
import type { Match, TournamentState, TournamentStateExtended } from '../stores/tournament'
import { log, insertionSortObjs } from '~/lib/Util'

export class MatchMaker {
    public store: TournamentStateExtended
    public byePlayer = ''
    public previousMeets: Map<string, number> = new Map()
    public playerPairs: string[][] = []

    constructor(store: TournamentStateExtended) {
        this.store = store
        this.previousMeets = getNumberOfMeetsBetweenPlayers(this.store.$state)
    }

    run() {
        this.setByePlayer()
        this.createPlayerPairs()
        this.persistPlayerPairsToMatches()
    }

    setByePlayer() {
        if (this.isEvenNumberOfPlayers) {
            return
        }
        this.byePlayer = this.getPlayerWithHighestByeRatio()
    }

    createPlayerPairs() {
        const playersListFilteredForBye = this.store.players.filter((player) => player !== this.byePlayer)
        const playerPairsSorted = MatchMaker.tryFindingGoodPairings(playersListFilteredForBye, this.previousMeets)

        // if there is a bye player, add it to the end of the array
        if (this.byePlayer) {
            playerPairsSorted.push([this.byePlayer, 'BYE'])
        }

        this.playerPairs = playerPairsSorted
    }

    static tryFindingGoodPairings(playersList: string[], meets: Map<string, number>) {
        let playerPairsSorted: string[][] = []
        const maxTries = 100000

        for (let i = 0; i < maxTries; i++) {
            // shuffle players
            const playersCloneShuffled = _.shuffle(playersList)

            // TODO: sort by score
            // const playersCloneShuffledSortedByScore = ...

            // create player pairs that are each sorted alphabetically
            playerPairsSorted = _.chunk(playersCloneShuffled, 2).map((pair) => pair.sort())

            // check if players have met too many times
            if (isPlayerPairsFreeOfPairsThatPlayedBefore(playerPairsSorted, meets)) {
                log('found unique matchups. used tries: ' + i)
                return playerPairsSorted
            }
        }

        log('no unique matchups found. use repeated matchups. used tries: ' + maxTries)

        // tmp solution: if no unique matchups are found, return the last created pairs
        return playerPairsSorted
    }

    persistPlayerPairsToMatches() {
        const matches = [...this.store.matches] as Match[]
        for (const pair of this.playerPairs) {
            matches.push({
                round: this.store.roundNr,
                player1: pair[0],
                player2: pair[1],
                score1: pair[1] === 'BYE' ? 9 : 0,
                score2: 0,
                dateStarted: new Date().getTime(),
                tournamentId: this.store.id,
            })
        }
        this.store.matches = matches
    }

    get isEvenNumberOfPlayers() {
        return this.store.players.length % 2 === 0
    }

    getPlayerWithHighestByeRatio(): string {
        const byeRatiosSorted = getByeRatiosSorted(this.store.$state)
        return byeRatiosSorted[0].player
    }
}

// ------------------------------------------------------------------------------------------------
// helper functions

function isPlayerPairsFreeOfPairsThatPlayedBefore(playerPairs: string[][], previousMeets: Map<string, number>) {
    for (const pair of playerPairs) {
        const key = pair.join('-')
        if (previousMeets.get(key) && previousMeets.get(key)! > 0) {
            return false
        }
    }
    return true
}

function getByeRatios(state: any) {
    const totalByes = getTotalByes(state) as any
    const matchesPlayedByPlayer = getNumberOfMatchesPlayedByPlayer(state) as any
    log(matchesPlayedByPlayer)
    const byeRatios = {} as any
    for (const player of state.players) {
        byeRatios[player] = 0
        const byes = totalByes[player]
        const matchesPlayed = matchesPlayedByPlayer[player]
        if (!matchesPlayed || !byes) {
            continue
        }
        byeRatios[player] = totalByes[player] / matchesPlayedByPlayer[player]
    }
    return byeRatios
}

function getTotalByes(state: any) {
    const byeRatios = {} as any
    for (const player of state.players) {
        byeRatios[player] = 0
    }
    for (const match of state.matches) {
        // maybe bye player is always player2 and therefore can be made simpler
        if (match.player2 === 'BYE') {
            byeRatios[match.player1]++
        }
        if (match.player1 === 'BYE') {
            byeRatios[match.player2]++
        }
    }
    return byeRatios
}

export function getNumberOfMatchesPlayedByPlayer(state: any) {
    const matchesPlayed = {} as any
    const matches = state.matches.filter((m: Match) => m.round <= state.finishedRoundNr)
    for (const match of matches) {
        if (match.player1 !== 'BYE') {
            const playerName = match.player1
            if (!matchesPlayed[playerName]) {
                matchesPlayed[playerName] = 0
            }
            matchesPlayed[playerName]++
        }
        if (match.player2 !== 'BYE') {
            const playerName = match.player2
            if (!matchesPlayed[playerName]) {
                matchesPlayed[playerName] = 0
            }
            matchesPlayed[playerName]++
        }
    }
    return matchesPlayed
}

export function getByeRatiosSorted(state: any) {
    const src = getByeRatios(state)
    let result = [] as any[]
    for (const player of Object.keys(src)) {
        result.push({
            player,
            ratio: src[player],
        })
    }
    result = _.shuffle(result)
    result = insertionSortObjs(result, 'ratio')
    return result
}

export function getNumberOfMeetsBetweenPlayers(state: any): Map<string, number> {
    const meets = new Map<string, number>()

    const matchesFilteredForByes = state.matches.filter((m: Match) => ![m.player1, m.player2].includes('BYE'))

    for (const match of matchesFilteredForByes) {
        const players = [match.player1, match.player2].sort()
        const key = `${players[0]}-${players[1]}`
        meets.set(key, meets.get(key) ? meets.get(key)! + 1 : 1)
    }

    return meets
}
