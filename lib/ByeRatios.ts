import { insertionSortObjs, log } from './Util'
import _ from 'lodash'

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
