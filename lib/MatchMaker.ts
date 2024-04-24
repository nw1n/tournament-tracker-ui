import _ from 'lodash'
import type { Match, TournamentStateExtended } from '../stores/tournament'
import { insertionSortObjs, log } from '~/lib/Util'

export class MatchMaker {
    public store: TournamentStateExtended
    public byePlayer = ''
    public previousMeets: Map<string, number> = new Map()
    public byeRatiosOfTournamentSorted: any[] = []
    public playerPairs: string[][] = []
    public byeMode: 'by-score' | 'not-by-score'

    constructor(store: TournamentStateExtended, byeMode: 'by-score' | 'not-by-score') {
        this.store = store
        this.byeMode = byeMode
        this.previousMeets = getNumberOfMeetsBetweenPlayers(this.store.$state)
        this.byeRatiosOfTournamentSorted = getByeRatiosSorted(this.store.$state)
        this.setByePlayer()
        this.createPlayerPairs()
    }

    setByePlayer() {
        this.byePlayer = ''
        if (this.isEvenNumberOfPlayers || !this.byeRatiosOfTournamentSorted?.length) {
            return
        }

        // filter out players that are excluded from bye
        const ratiosFilteredForExcludedPlayers = this.byeRatiosOfTournamentSorted.filter(
            (ratio) => !this.store.playersExcludedFromBye.includes(ratio.player),
        )

        // if no players left, but uneven number of players, log error
        if (!ratiosFilteredForExcludedPlayers.length) {
            console.error('no players left for bye, but uneven number of players.')
            return
        }

        // get a list of players tied for the lowest ratio
        console.log('ratiosFilteredForExcludedPlayers', ratiosFilteredForExcludedPlayers)
        const lowestRatio = ratiosFilteredForExcludedPlayers[0].ratio
        const playersWithLowestRatio = ratiosFilteredForExcludedPlayers.filter((ratio) => ratio.ratio === lowestRatio)

        if (this.byeMode === 'not-by-score') {
            log('MODE: set bye player not by score, but random')
            const shuffledPlayersWithLowestRatio = _.shuffle(playersWithLowestRatio.slice())
            this.byePlayer = shuffledPlayersWithLowestRatio[0].player
            return
        }

        if (this.byeMode === 'by-score') {
            log('MODE: set bye player by score')

            // use player scores for bye selection
            const playerScoresSorted = this.store.allTournamentScoresSorted
            log('playerScores', playerScoresSorted)

            log('playersWithLowestRatio', playersWithLowestRatio)
            const playerScoresSortedFilteredForLowestByeRatio = playerScoresSorted.filter((playerScore) =>
                playersWithLowestRatio.map((ratio) => ratio.player).includes(playerScore.player),
            )
            log('playerScoresSortedFilteredForPlayersWithLowestRatio', playerScoresSortedFilteredForLowestByeRatio)
            const lowestScore = _.last(playerScoresSortedFilteredForLowestByeRatio).score
            const resultArr = playerScoresSortedFilteredForLowestByeRatio.filter(
                (playerScore) => playerScore.score === lowestScore,
            )
            log('resultArr', resultArr)
            const resultArrShuffled = _.shuffle(resultArr)
            this.byePlayer = resultArrShuffled[0].player
        }
    }

    createPlayerPairs() {
        const playersListFilteredForBye = this.store.players.filter((player) => player !== this.byePlayer)
        const playerPairsSorted = MatchMaker.tryFindingGoodPairings(
            playersListFilteredForBye,
            this.previousMeets,
            this.store.allTournamentScoresSorted,
        )

        // if there is a bye player, add it to the end of the array
        if (this.byePlayer) {
            playerPairsSorted.push([this.byePlayer, 'BYE'])
        }

        this.playerPairs = playerPairsSorted
    }

    static tryFindingGoodPairings(playersList: string[], meets: Map<string, number>, playerScores: any[]) {
        let playerPairsSorted: string[][] = []
        const maxTries = 300
        const playersScoreClone = playerScores.slice()

        for (let i = 0; i < maxTries; i++) {
            // sort by score
            const tmp = playersList.map((player) => {
                return playersScoreClone.find((p) => p.player === player)
            })
            console.log('tmp', tmp)
            const tmpShuffled = _.shuffle(tmp)
            const tmpShuffledSorted = tmpShuffled.sort((a, b) => b.score - a.score)
            console.log('tmpShuffledSorted', tmpShuffledSorted)
            const tmpShuffledSortedPlayerNames = tmpShuffledSorted.map((p) => p.player)
            console.log('tmpShuffledSortedPlayerNames', tmpShuffledSortedPlayerNames)

            for (let j = 0; j < tmpShuffledSortedPlayerNames.length; j += 1) {
                const player1 = tmpShuffledSortedPlayerNames[j]
                for (let k = 0; k < tmpShuffledSortedPlayerNames.length; k += 1) {
                    const player2 = tmpShuffledSortedPlayerNames[k]
                    if (player1 === player2) {
                        continue
                    }

                    // check for potential dupllcates in this round
                    const playerPairsSortedFlat = playerPairsSorted.flat()
                    if (playerPairsSortedFlat.includes(player1) || playerPairsSortedFlat.includes(player2)) {
                        continue
                    }

                    // check if the players have met before in previous rounds
                    const pair = [player1, player2].sort()
                    if (isPlayerPairsFreeOfPairsThatPlayedBefore([pair], meets)) {
                        playerPairsSorted.push(pair)
                    }
                }
            }

            // check if correct number of pairs are created
            if (playerPairsSorted.length !== playersList.length / 2) {
                playerPairsSorted = []
                continue
            }

            // check if players have met too many times
            if (isPlayerPairsFreeOfPairsThatPlayedBefore(playerPairsSorted, meets)) {
                log('found unique matchups. used tries: ' + i)
                return playerPairsSorted
            }
        }

        log(`no unique matchups found. used tries: ${maxTries}. Use random matchups instead.`)

        // if no solution found, return a random solution
        playerPairsSorted = _.chunk(_.shuffle(playersList), 2).map((pair) => pair.sort())
        return playerPairsSorted
    }

    get isEvenNumberOfPlayers() {
        return this.store.players.length % 2 === 0
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

// ------------------------------------------------------------------------------------------------
// bye-functions
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

function getByeRatiosSorted(state: any) {
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

function getByeRatios(state: any): any {
    const totalByes = getTotalByes(state) as any
    const matchesPlayedByPlayer = getNumberOfMatchesPlayedByPlayer(state) as any
    log(matchesPlayedByPlayer)
    const byeRatios = {} as any
    for (const player of state.players) {
        if (!matchesPlayedByPlayer[player]) {
            byeRatios[player] = 1
            continue
        }
        byeRatios[player] = totalByes[player] / matchesPlayedByPlayer[player]
    }
    return byeRatios
}

function getTotalByes(state: any) {
    const totalByes = {} as any
    for (const player of state.players) {
        totalByes[player] = 0
    }
    for (const match of state.matches) {
        // maybe bye player is always player2 and therefore can be made simpler
        if (match.player2 === 'BYE') {
            totalByes[match.player1]++
        }
        if (match.player1 === 'BYE') {
            totalByes[match.player2]++
        }
    }
    return totalByes
}

function getNumberOfMatchesPlayedByPlayer(state: any) {
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
