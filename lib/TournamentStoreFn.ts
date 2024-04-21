import _ from 'lodash'
import type { Match, TournamentState, TournamentStateExtended } from '../stores/tournament'
import { insertionSortObjs, log } from '~/lib/Util'
import { MatchMaker } from './MatchMaker'

export function changeScore(self: TournamentStateExtended, round: number, player: string, scoreChange: number = 1) {
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

export function getPlayersUniqueFromMatches(matches: Match[]) {
    const players: string[] = matches.map((m) => [m.player1, m.player2]).flat()
    const uniquePlayers = Array.from(new Set(players))
    const filteredPlayers = uniquePlayers.filter((p) => p !== 'BYE')
    log('players', filteredPlayers)
    return filteredPlayers
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
