export class Config {
    static instance: Config

    isDevMode: boolean = false

    constructor() {
        const appConfig = useAppConfig()

        if (appConfig.isDevMode) {
            this.isDevMode = true
        }
    }

    static getInstance(): Config {
        if (!Config.instance) {
            Config.instance = new Config()
        }
        return Config.instance
    }
}
