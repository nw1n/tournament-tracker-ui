export class ServerApi {
    static instance: ServerApi

    serverUrl = 'http://localhost:5000'

    async fetchAllServerData() {
        const response = await fetch(`${this.serverUrl}`)
        return await response.json()
    }

    static getInstance(): ServerApi {
        if (!ServerApi.instance) {
            ServerApi.instance = new ServerApi()
        }
        return ServerApi.instance
    }
}
