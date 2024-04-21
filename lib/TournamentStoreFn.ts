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
    const playersSet = new Set<string>()

    for (const match of matches) {
        playersSet.add(match.player1)
        playersSet.add(match.player2)
    }

    playersSet.delete('BYE')
    return Array.from(playersSet)
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
    let result = [1, 1]

    if (match.score1 > match.score2) {
        result = [2, 0]
    }
    // case player2 wins
    if (match.score1 < match.score2) {
        result = [0, 2]
    }

    return {
        [match.player1]: result[0],
        [match.player2]: result[1],
    }
}
