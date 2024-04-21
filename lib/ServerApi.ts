import type { SettingsState } from '~/stores/settings'

export class ServerApi {
    static instance: ServerApi

    static getInstance(): ServerApi {
        if (!ServerApi.instance) {
            ServerApi.instance = new ServerApi()
        }
        return ServerApi.instance
    }

    async fetchAllServerData() {
        const response = await fetch(`${this.serverUrl}`)
        return await response.json()
    }

    async postTournamentData(finishedMatches: any[]) {
        const url = new URL('save-tournament/', this.serverUrl)
        console.log('post tournament data to url', url)
        fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                tournament: JSON.stringify(finishedMatches),
                password: this.serverPassword,
            }),
        })
            .then((response) => response.json())
            .then((data) => {
                console.log('Success:', data)
            })
            .catch((error) => {
                console.error('Error:', error)
            })
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
