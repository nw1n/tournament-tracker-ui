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

    get serverUrl(): string {
        // read serverUrl directly from localStorage instead of using pinia
        const localStorageSettingsStr = localStorage.getItem('settings') as any

        if (!localStorageSettingsStr) {
            return 'http://localhost:5000'
        }

        const localStorageSettings = JSON.parse(localStorageSettingsStr)

        return localStorageSettings.serverUrl || 'http://localhost:5000'
    }
}
