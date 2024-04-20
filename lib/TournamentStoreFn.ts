import _ from 'lodash'
import type { Match, TournamentState, TournamentStateExtended } from '../stores/tournament'
import { insertionSortObjs, log } from '~/lib/Util'
import { MatchMaker } from './MatchMaker'

export class TournamentStoreActions {
    static createMatchesForRound(store: TournamentStateExtended) {
        const matchMaker = new MatchMaker(store)
        matchMaker.run()
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
