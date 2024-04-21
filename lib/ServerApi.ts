export class ServerApi {
    static instance: ServerApi

    public serverUrl = 'http://localhost:5000'

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
}
