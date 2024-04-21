import _ from 'lodash'
import type { Match, TournamentStateExtended } from '../stores/tournament'
import { log, insertionSortObjs } from '~/lib/Util'
import { getAllTournamentScores } from './TournamentStoreFn'

export class MatchMaker {
    public store: TournamentStateExtended
    public byePlayer = ''
    public playerPairs: string[][] = []

    constructor(store: TournamentStateExtended) {
        this.store = store
    }

    public run() {
        this.setByePlayer()
        const playerScoreMapFilteredForActivePlayersWithoutByePlayer =
            this.createPlayerScoreMapFilteredForActivePlayersAndBye()
        this.playerPairs = this.createPlayerPairs(playerScoreMapFilteredForActivePlayersWithoutByePlayer)
        this.persistPlayerPairsToMatches(this.playerPairs)
    }

    public setByePlayer() {
        if (this.isEvenNumberOfPlayers) {
            return
        }
        this.byePlayer = this.getPlayerWithHighestByeRatio()
    }

    public createPlayerScoreMapFilteredForActivePlayersAndBye() {
        // clone players array. MAJOR ISSUE: bad practice using getAllTournamentScores here
        let tournamentPlayerScoreMap = _.cloneDeep(getAllTournamentScores(this.store.$state) as any[])

        console.log('tournamentPlayerScoreMap', tournamentPlayerScoreMap)

        // filter players that are not in players array
        const playerScoreMapFilteredForActivePlayers = tournamentPlayerScoreMap.filter((p) =>
            this.store.players.includes(p.player),
        )

        // remove bye player
        const playerScoreMapFilteredForActivePlayersWithoutByePlayer = playerScoreMapFilteredForActivePlayers.filter(
            (p) => {
                if (this.byePlayer) {
                    return p.player !== this.byePlayer
                }
                return true
            },
        )
        return playerScoreMapFilteredForActivePlayersWithoutByePlayer
    }

    public createPlayerPairs(tournamentPlayerScoreMapFilteredForActivePlayersWithoutByePlayer: any[] = []): string[][] {
        // try avoid players meeting each other too many times
        const meets = getNumberOfMeetsBetweenPlayers(this.store.$state)

        let playerPairsSorted: string[][] = []
        let isGoodMatchupsFound = false

        let i = 0
        for (i = 0; i < 100000; i++) {
            // shuffle players
            const playersCloneShuffled = _.shuffle(tournamentPlayerScoreMapFilteredForActivePlayersWithoutByePlayer)

            // sort by score
            // playersClone = insertionSortObjs(playersClone, 'score').reverse()

            // create simple player array
            const playersNameList = playersCloneShuffled.map((p) => p.player)

            // create pairs
            const playerPairsUnSorted = _.chunk(playersNameList, 2)

            // sort the two players in each pair by name
            playerPairsSorted = playerPairsUnSorted.map((pair) => {
                pair.sort()
                return pair
            })

            // check if players have met too many times
            let hasTooManyMeets = false
            for (const pair of playerPairsSorted) {
                const key = pair.join('-')
                if (meets[key] > 0) {
                    hasTooManyMeets = true
                    // break inner for loop
                    break
                }
            }
            if (!hasTooManyMeets) {
                isGoodMatchupsFound = true
                // break outer for loop
                break
            }
        }

        if (isGoodMatchupsFound) {
            log('found unique matchups. used tries: ' + i)
        } else {
            log('no unique matchups found. use repeated matchups. used tries: ' + i)
        }

        // if there is a bye player, add it to the end of the array
        if (this.byePlayer) {
            playerPairsSorted.push([this.byePlayer, 'BYE'])
        }

        return playerPairsSorted
    }

    public persistPlayerPairsToMatches(playerPairs: string[][]) {
        const matches = [...this.store.matches] as Match[]
        for (const pair of playerPairs) {
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

    public get isEvenNumberOfPlayers() {
        return this.store.players.length % 2 === 0
    }

    public getPlayerWithHighestByeRatio(): string {
        const byeRatiosSorted = getByeRatiosSorted(this.store.$state)
        return byeRatiosSorted[0].player
    }
}

// ------------------------------------------------------------------------------------------------
// helper functions

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

export function getNumberOfMeetsBetweenPlayers(state: any) {
    const meets = {} as any
    for (const match of state.matches) {
        if (match.player1 === 'BYE' || match.player2 === 'BYE') {
            continue
        }
        const players = [match.player1, match.player2]
        players.sort()
        const key = players.join('-')
        if (!meets[key]) {
            meets[key] = 0
        }
        meets[key]++
    }
    return meets
}
