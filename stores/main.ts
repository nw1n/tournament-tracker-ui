import { defineStore } from 'pinia'
import { formatTime, log } from '~/lib/Util'
import _ from 'lodash'

interface Match {
    round: number
    player1: string
    player2: string
    score1: number
    score2: number
    dateStarted: Date
}

export const useTournamentStore = defineStore('tournament', {
    state: () => ({
        roundNr: 0,
        finishedRoundNr: 0,
        players: [] as string[],
        startDate: undefined as Date | undefined,
        id: 0,
        matches: [] as Match[],
    }),
    actions: {
        createMatchesForRound(roundNr: number) {
            let nextByePlayer = ''
            const players = this.players

            if (players.length % 2 !== 0) {
                // find player with least byes
                nextByePlayer = getByeRatiosSorted(this.$state)[0].player
            }

            // clone players array
            let playersClone = _.cloneDeep(getAllTournamentScores(this.$state) as any[])

            // remove bye player
            if (nextByePlayer) {
                playersClone = playersClone.filter((p) => p.player !== nextByePlayer)
            }

            // try avoid players meeting each other too many times
            const meets = getNumberOfMeetsBetweenPlayers(this.$state)
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

            const matches = [...this.matches] as Match[]
            for (const pair of playerPairs) {
                matches.push({
                    round: roundNr,
                    player1: pair[0],
                    player2: pair.length === 2 ? pair[1] : 'BYE',
                    score1: pair.length === 2 ? 0 : 9,
                    score2: 0,
                    dateStarted: new Date(),
                })
            }
            this.matches = matches
        },
        createMatchesForRoundWithNoRepeats(roundNr: number) {
            this.createMatchesForRound(roundNr)
        },
        init() {
            log('Initializing tournament')
            this.roundNr = 1
            this.finishedRoundNr = 0
            this.players = []
            this.startDate = new Date()
            this.id = this.startDate.getTime()
            this.matches = []
        },
        reset() {
            this.roundNr = 0
            this.finishedRoundNr = 0
            this.players = []
            this.startDate = undefined
            this.id = 0
            this.matches = []
        },
        endAndReset() {
            this.reset()
        },
        addPlayer(player: string) {
            this.players.push(player)
        },
        removePlayer(player: string) {
            this.players = this.players.filter((p) => p !== player)
        },
        resetPlayers() {
            this.players = []
        },
        endRound() {
            this.finishedRoundNr = this.roundNr
        },
        nextRound() {
            this.roundNr++
        },
        endRoundAndNextRound() {
            this.endRound()
            this.nextRound()
        },
        createNewMatches() {
            this.createMatchesForRoundWithNoRepeats(this.roundNr)
        },
        endRoundAndCreateNewMatches() {
            this.endRoundAndNextRound()
            this.createNewMatches()
        },
        increaseScore(round: number, player: string, scoreChange: number = 1) {
            log(`increaseScore round ${round} player ${player}`)
            const matches = _.cloneDeep(this.matches)
            const match = matches.find((m) => m.round === round && (m.player1 === player || m.player2 === player))
            if (match) {
                if (match.player1 === player) {
                    match.score1 += scoreChange
                } else {
                    match.score2 += scoreChange
                }
            }
            this.matches = matches
        },
    },
    getters: {
        isTournamentActive: (state) => state.roundNr > 0,
        isBuyMatch: (state) => (match: Match) => {
            return match.player2 === 'BYE' || match.player1 === 'BYE'
        },
        matchesByRound: (state) => (round: number) => state.matches.filter((m) => m.round === round),
        allTournamentScores: (state) => {
            console.log('allTournamentScores')
            return getAllTournamentScores(state)
        },
        allTournamentScoresSorted: (state) => {
            const scores = getAllTournamentScores(state)
            return insertionSortObjs(scores, 'score').reverse()
        },
        isPlayerExists: (state) => (player: string) => state.players.includes(player),
        byeRatios: (state) => {
            return getByeRatiosSorted(state)
        },
        timeRoundStarted: (state) => (round: number) => {
            const match = state.matches.find((m) => m.round === round)
            if (!match || !match.dateStarted) {
                return undefined
            }
            return formatTime(match.dateStarted)
        },
        timePassedSinceStartOfCurrentRound: (state) => (roundNr: number) => {
            const match = state.matches.find((m) => m.round === roundNr)
            if (!match || !match.dateStarted) {
                return undefined
            }
            const currentTime = new Date()
            const matchDateStarted = new Date(match.dateStarted)
            console.log('timePassedSinceStartOfCurrentRound', currentTime, matchDateStarted)
            const diff = currentTime.getTime() - matchDateStarted.getTime()
            return diff
        },
    },
    persist: {
        storage: persistedState.localStorage,
    },
})

function getNumberOfMeetsBetweenPlayers(state: any) {
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

function getTotalByes(state: any) {
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

function getByeRatiosSorted(state: any) {
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

function getByeRatios(state: any) {
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

function getAllTournamentScores(state: any) {
    const result = [] as any[]
    for (const player of state.players) {
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

function getTournamentScoresFromMatch(match: Match): any {
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
function insertionSortObjs(arr: any[], key: string) {
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
