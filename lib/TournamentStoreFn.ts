import _ from 'lodash'
import type { Match, TournamentStateExtended } from '../stores/tournament'
import { log } from '~/lib/Util'

export function changeScore(self: TournamentStateExtended, round: number, player: string, scoreChange: number) {
    const match = self.matches.find((m) => m.round === round && [m.player1, m.player2].includes(player))

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

    // trigger update
    self.matches = self.matches.slice()
}

export function getAllTournamentScores(state: any) {
    const players = new Set<string>(state.players)

    // tmp: add players that are not in players array
    for (const match of state.matches) {
        players.add(match.player1)
        players.add(match.player2)
    }

    // remove BYE
    players.delete('BYE')

    // create result object
    const result = Array.from(players).map((player) => ({
        player,
        score: 0,
    }))

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
    let player1Score = 1
    let player2Score = 1

    if (match.score1 > match.score2) {
        player1Score = 2
        player2Score = 0
    }
    if (match.score1 < match.score2) {
        player1Score = 0
        player2Score = 2
    }

    return {
        [match.player1]: player1Score,
        [match.player2]: player2Score,
    }
}
