import _ from 'lodash'
import type { Match, TournamentStateExtended } from '../stores/tournament'
import { insertionSortObjs, log } from '~/lib/Util'

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
    const scores = new Map<string, number>()

    // add active players
    for (const player of state.players) {
        scores.set(player, 0)
    }

    // add all players (even if they have dropped out)
    for (const match of state.matches) {
        scores.set(match.player1, 0)
        scores.set(match.player2, 0)
    }

    // remove BYE
    scores.delete('BYE')

    // filter for finished matches
    const finishedMatches = state.matches.filter((m: Match) => m.round <= state.finishedRoundNr)

    // add scores from finished matches
    for (const match of finishedMatches) {
        if (match.score1 > match.score2) {
            scores.set(match.player1, scores.get(match.player1)! + 2)
        } else if (match.score2 > match.score1) {
            scores.set(match.player2, scores.get(match.player2)! + 2)
        } else {
            scores.set(match.player1, scores.get(match.player1)! + 1)
            scores.set(match.player2, scores.get(match.player2)! + 1)
        }
    }

    // convert to array of objects
    const scoresArray = Array.from(scores).map(([player, score]) => ({ player, score }))

    // sort by score
    return insertionSortObjs(scoresArray, 'score', 'desc')
}
