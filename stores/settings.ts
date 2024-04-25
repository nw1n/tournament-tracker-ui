import { defineStore } from 'pinia'
import { formatTime, log } from '~/lib/Util'
import _ from 'lodash'

export interface SettingsState {
    serverUrl: string
    password: string
    roundTimeMinutes: number
    isDebugMode: boolean
    predefinedPlayers: string[]
    byeMode: 'by-score' | 'not-by-score'
}

export const useSettingsStore = defineStore('settings', {
    state: () => ({
        serverUrl: 'http://localhost:5000',
        password: '',
        roundTimeMinutes: 50,
        isDebugMode: false,
        predefinedPlayers: ['Alice', 'Bob', 'Charlie', 'David'], // TMP
        byeMode: 'by-score',
    }),
    getters: {
        roundTimeInMilliSeconds: (state) => {
            return state.roundTimeMinutes * 60 * 1000
        },
    },
    persist: {
        storage: persistedState.localStorage,
    },
})
