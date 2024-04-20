import _ from 'lodash'
import type { Match, TournamentState, TournamentStateExtended } from '../stores/main'

export class ActionFns {
    static createMatchesForRound(self: TournamentStateExtended, roundNr: number) {
        let nextByePlayer = ''
        const players = self.players

        if (players.length % 2 !== 0) {
            // find player with least byes
            nextByePlayer = getByeRatiosSorted(self.$state)[0].player
        }

        // clone players array. MAJOR ISSUE: bad practice using getAllTournamentScores here
        let playersClone = _.cloneDeep(getAllTournamentScores(self.$state) as any[])

        // filter players that are not in players array
        playersClone = playersClone.filter((p) => players.includes(p.player))

        // remove bye player
        if (nextByePlayer) {
            playersClone = playersClone.filter((p) => p.player !== nextByePlayer)
        }

        // try avoid players meeting each other too many times
        const meets = getNumberOfMeetsBetweenPlayers(self.$state)
        let playersRes = [] as any[]
        let playerPairs = [] as any[]
        let isGoodMatchupsFound = false

        let i = 0
        for (i = 0; i < 100000; i++) {
            // shuffle players
            playersClone = _.shuffle(playersClone)

            // sort by score
            // playersClone = insertionSortObjs(playersClone, 'score').reverse()

            // create simple player array
            playersRes = playersClone.map((p) => p.player)

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
            console.log('found unique matchups. used tries: ' + i)
        } else {
            console.log('no unique matchups found. use repeated matchups. used tries: ' + i)
        }

        // if there is a bye player, add it to the end of the array
        if (nextByePlayer) {
            playerPairs.push([nextByePlayer])
        }

        const matches = [...self.matches] as Match[]
        for (const pair of playerPairs) {
            matches.push({
                round: roundNr,
                player1: pair[0],
                player2: pair.length === 2 ? pair[1] : 'BYE',
                score1: pair.length === 2 ? 0 : 9,
                score2: 0,
                dateStarted: new Date().getTime(),
                tournamentId: self.id,
            })
        }
        self.matches = matches
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
    console.log(matchesPlayedByPlayer)
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
    console.log('players', players)
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

// insertionsort object array
export function insertionSortObjs(arr: any[], key: string) {
    for (let i = 1; i < arr.length; i++) {
        let j = i - 1
        let temp = arr[i]
        while (j >= 0 && arr[j][key] > temp[key]) {
            arr[j + 1] = arr[j]
            j--
        }
        arr[j + 1] = temp
    }
    return arr
}
