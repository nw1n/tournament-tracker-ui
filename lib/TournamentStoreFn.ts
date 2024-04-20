import _ from 'lodash'
import type { Match, TournamentState, TournamentStateExtended } from '../stores/tournament'
import { insertionSortObjs, log } from '~/lib/Util'

export class MatchMaker {
    public store: TournamentStateExtended
    public nextByePlayer = ''
    public players: string[] = []
    public playerPairs: string[][] = []
    public isGoodMatchupsFound = false

    constructor(store: TournamentStateExtended) {
        this.store = store
        this.players = store.players
    }

    public setNextByePlayer() {
        if (!this.isOddNumberOfPlayers) {
            return
        }
        this.nextByePlayer = getByeRatiosSorted(this.store.$state)[0].player
    }

    public get isOddNumberOfPlayers() {
        return this.players.length % 2 !== 0
    }

    public createTournamentPlayerScoreMapFilteredForActivePlayersWithoutByePlayer() {
        // clone players array. MAJOR ISSUE: bad practice using getAllTournamentScores here
        let tournamentPlayerScoreMap = _.cloneDeep(getAllTournamentScores(this.store.$state) as any[])

        console.log('tournamentPlayerScoreMap', tournamentPlayerScoreMap)

        // filter players that are not in players array
        const tournamentPlayerScoreMapFilteredForActivePlayers = tournamentPlayerScoreMap.filter((p) =>
            this.players.includes(p.player),
        )

        // remove bye player
        const tournamentPlayerScoreMapFilteredForActivePlayersWithoutByePlayer =
            tournamentPlayerScoreMapFilteredForActivePlayers.filter((p) => {
                if (this.nextByePlayer) {
                    return p.player !== this.nextByePlayer
                }
                return true
            })
        return tournamentPlayerScoreMapFilteredForActivePlayersWithoutByePlayer
    }

    public createPlayerPairs(tournamentPlayerScoreMapFilteredForActivePlayersWithoutByePlayer: any[] = []): string[][] {
        // try avoid players meeting each other too many times
        const meets = getNumberOfMeetsBetweenPlayers(this.store.$state)
        let playersRes = [] as any[]
        let playerPairs = [] as any[]
        let isGoodMatchupsFound = false

        let i = 0
        for (i = 0; i < 100000; i++) {
            // shuffle players
            const playersCloneShuffled = _.shuffle(tournamentPlayerScoreMapFilteredForActivePlayersWithoutByePlayer)

            // sort by score
            // playersClone = insertionSortObjs(playersClone, 'score').reverse()

            // create simple player array
            playersRes = playersCloneShuffled.map((p) => p.player)

            // create matches
            playerPairs = _.chunk(playersRes, 2)

            // sort pairs
            playerPairs = playerPairs.map((pair) => {
                pair.sort()
                return pair
            })

            // check if players have met too many times
            let hasTooManyMeets = false
            for (const pair of playerPairs) {
                const key = pair.join('-')
                if (meets[key] > 0) {
                    hasTooManyMeets = true
                    break
                }
            }
            if (!hasTooManyMeets) {
                isGoodMatchupsFound = true
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
            playerPairs.push([this.nextByePlayer, 'BYE'])
        }

        return playerPairs
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

export class TournamentStoreActions {
    static createMatchesForRound(store: TournamentStateExtended) {
        const matchMaker = new MatchMaker(store)

        matchMaker.setNextByePlayer()
        const tournamentPlayerScoreMapFilteredForActivePlayersWithoutByePlayer =
            matchMaker.createTournamentPlayerScoreMapFilteredForActivePlayersWithoutByePlayer()

        // try avoid players meeting each other too many times
        const playerPairs = matchMaker.createPlayerPairs(
            tournamentPlayerScoreMapFilteredForActivePlayersWithoutByePlayer,
        )

        matchMaker.persistPlayerPairsToMatches(playerPairs)
    }

    static changeScore(self: TournamentStateExtended, round: number, player: string, scoreChange: number = 1) {
        log(`increaseScore round ${round} player ${player}`)
        const matches = _.cloneDeep(self.matches)
        // find match by round and player
        const match = matches.find((m) => m.round === round && [m.player1, m.player2].includes(player))

        if (!match) {
            log('failed increasing score, match not found')
            return
        }

        // increase score
        if (match.player1 === player) {
            match.score1 += scoreChange
        } else {
            match.score2 += scoreChange
        }
        self.matches = matches
    }

    static getTimePassedSinceStartOfCurrentRound(self: TournamentStateExtended): number {
        const state = self.$state
        const match = state.matches.find((m) => m.round === state.roundNr)
        if (!match || !match.dateStarted) {
            log('no match or dateStarted found for round', state.roundNr, match)
            return 0
        }
        const currentTime = new Date()
        const matchDateStarted = new Date(match.dateStarted)
        return currentTime.getTime() - matchDateStarted.getTime()
    }
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

export function getTotalByes(state: any) {
    const byeRatios = {} as any
    for (const player of state.players) {
        byeRatios[player] = 0
    }
    for (const match of state.matches) {
        if (match.player2 === 'BYE') {
            byeRatios[match.player1]++
        }
        if (match.player1 === 'BYE') {
            byeRatios[match.player2]++
        }
    }
    return byeRatios
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

export function getByeRatios(state: any) {
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

export function getPlayersUniqueFromMatches(matches: Match[]) {
    const players = [] as string[]
    for (const match of matches) {
        if (match.player1 !== 'BYE') {
            players.push(match.player1)
        }
        if (match.player2 !== 'BYE') {
            players.push(match.player2)
        }
    }
    log('players', players)
    return _.uniq(players)
}

export function getAllTournamentScores(state: any) {
    const result = [] as any[]
    const players = state.players.slice()

    // tmp: add players that are not in players array
    const otherPlayers = getPlayersUniqueFromMatches(state.matches.slice())
    for (const player of otherPlayers) {
        if (!players.includes(player)) {
            players.push(player)
        }
    }

    // create result object
    for (const player of players) {
        const obj = {
            player,
            score: 0,
        }
        result.push(obj)
    }
    const matches = state.matches.filter((m: Match) => m.round <= state.finishedRoundNr)
    for (const match of matches) {
        const scoreObj = getTournamentScoresFromMatch(match) as any
        for (const player of Object.keys(scoreObj)) {
            const resultObj = result.find((r) => r.player === player)
            if (resultObj) {
                resultObj.score += scoreObj[player]
            }
        }
    }
    return result
}

export function getTournamentScoresFromMatch(match: Match): any {
    const isDraw = match.score1 === match.score2
    const isPlayer1Winner = match.score1 > match.score2
    const isPlayer2Winner = match.score1 < match.score2
    if (isDraw) {
        return {
            [match.player1]: 1,
            [match.player2]: 1,
        }
    }
    if (isPlayer1Winner) {
        return {
            [match.player1]: 2,
            [match.player2]: 0,
        }
    }
    if (isPlayer2Winner) {
        return {
            [match.player1]: 0,
            [match.player2]: 2,
        }
    }
}
