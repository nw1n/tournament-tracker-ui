import type { SettingsState } from '~/stores/settings'

export class ServerApi {
    static instance: ServerApi

    static getInstance(): ServerApi {
        if (!ServerApi.instance) {
            ServerApi.instance = new ServerApi()
        }
        return ServerApi.instance
    }

    async fetchTestServerData() {
        const response = await fetch(`${this.serverUrl}`)
        return await response.json()
    }

    async fetchPredefinedPlayers() {
        const url = new URL(`predefined-players/${this.serverPassword}`, this.serverUrl)
        console.log('fetch predefined players from url', url)

        try {
            const response = await fetch(url)
            const data = await response.json()
            console.log('Success fetching data from server:', data)
            return data
        } catch (error) {
            console.error('Error fetching data from server', error)
        }
    }

    async postTournamentData(finishedMatches: any[]) {
        const url = new URL('save-tournament/', this.serverUrl)
        console.log('post tournament data to url', url)

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    tournament: JSON.stringify(finishedMatches),
                    password: this.serverPassword,
                }),
            })

            const data = await response.json()
            console.log('Success:', data)
            return data
        } catch (error) {
            console.error('Error:', error)
        }
    }

    get settings(): SettingsState {
        // read settings directly from localStorage instead of using pinia
        const localStorageSettingsStr = localStorage.getItem('settings') as any

        if (!localStorageSettingsStr) {
            return {} as SettingsState
        }

        return JSON.parse(localStorageSettingsStr) as SettingsState
    }

    get serverUrl(): string {
        return this.settings.serverUrl || 'http://localhost:5000'
    }

    get serverPassword(): string {
        return this.settings.password || ''
    }
}
