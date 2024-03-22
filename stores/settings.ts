import { defineStore } from 'pinia'
import { formatTime, log } from '~/lib/Util'
import _ from 'lodash'

export const useSettingsStore = defineStore('settings', {
    state: () => ({
        serverUrl: 'http://localhost:5000',
        roundTimeMinutes: 30,
        isDebugMode: false,
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
