import _ from 'lodash'
import type { Match, TournamentStateExtended } from '../stores/tournament'
import { log } from '~/lib/Util'
import { getByeRatiosSorted } from './ByeRatios'

export class MatchMaker {
    public store: TournamentStateExtended
    public byePlayer = ''
    public previousMeets: Map<string, number> = new Map()
    public byeRatiosSorted: any[] = []
    public playerPairs: string[][] = []

    constructor(store: TournamentStateExtended) {
        this.store = store
        this.previousMeets = getNumberOfMeetsBetweenPlayers(this.store.$state)
        this.byeRatiosSorted = getByeRatiosSorted(this.store.$state)
        this.setByePlayer()
        this.createPlayerPairs()
    }

    setByePlayer() {
        if (this.isEvenNumberOfPlayers) {
            return
        }
        this.byePlayer = this.playerWithHighestByeRatio
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

    get isEvenNumberOfPlayers() {
        return this.store.players.length % 2 === 0
    }

    get playerWithHighestByeRatio(): string {
        return this.byeRatiosSorted?.length ? this.byeRatiosSorted[0].player : ''
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

function getNumberOfMeetsBetweenPlayers(state: any): Map<string, number> {
    const meets = new Map<string, number>()

    const matchesFilteredForByes = state.matches.filter((m: Match) => ![m.player1, m.player2].includes('BYE'))

    for (const match of matchesFilteredForByes) {
        const players = [match.player1, match.player2].sort()
        const key = `${players[0]}-${players[1]}`
        meets.set(key, meets.get(key) ? meets.get(key)! + 1 : 1)
    }

    return meets
}
