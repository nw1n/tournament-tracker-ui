import _ from 'lodash'
import type { Match, TournamentStateExtended } from '../stores/tournament'
import { log } from '~/lib/Util'
import { getByeRatiosSorted, getAllTournamentScores, getNumberOfMeetsBetweenPlayers } from './TournamentStoreFn'

export class MatchMaker {
    public store: TournamentStateExtended
    public nextByePlayer = ''
    public players: string[] = []
    public playerPairs: string[][] = []

    constructor(store: TournamentStateExtended) {
        this.store = store
        this.players = store.players
    }

    public run() {
        this.setNextByePlayer()
        const playerScoreMapFilteredForActivePlayersWithoutByePlayer =
            this.createPlayerScoreMapFilteredForActivePlayersAndBye()
        this.playerPairs = this.createPlayerPairs(playerScoreMapFilteredForActivePlayersWithoutByePlayer)
        this.persistPlayerPairsToMatches(this.playerPairs)
    }

    public setNextByePlayer() {
        if (this.isEvenNumberOfPlayers) {
            return
        }
        this.nextByePlayer = getByeRatiosSorted(this.store.$state)[0].player
    }

    public get isEvenNumberOfPlayers() {
        return this.players.length % 2 === 0
    }

    public createPlayerScoreMapFilteredForActivePlayersAndBye() {
        // clone players array. MAJOR ISSUE: bad practice using getAllTournamentScores here
        let tournamentPlayerScoreMap = _.cloneDeep(getAllTournamentScores(this.store.$state) as any[])

        console.log('tournamentPlayerScoreMap', tournamentPlayerScoreMap)

        // filter players that are not in players array
        const playerScoreMapFilteredForActivePlayers = tournamentPlayerScoreMap.filter((p) =>
            this.players.includes(p.player),
        )

        // remove bye player
        const playerScoreMapFilteredForActivePlayersWithoutByePlayer = playerScoreMapFilteredForActivePlayers.filter(
            (p) => {
                if (this.nextByePlayer) {
                    return p.player !== this.nextByePlayer
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
        if (this.nextByePlayer) {
            playerPairsSorted.push([this.nextByePlayer, 'BYE'])
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
}
