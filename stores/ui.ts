import { defineStore } from 'pinia'

export const useUiStore = defineStore('ui', {
    state: () => ({
        roundTimeLength: minToMs(30),
        isFullScreenMenuOpen: false,
    }),
    actions: {
        toggleFullScreenMenu() {
            this.isFullScreenMenuOpen = !this.isFullScreenMenuOpen
        },
        openFullScreenMenu() {
            this.isFullScreenMenuOpen = true
        },
        closeFullScreenMenu() {
            this.isFullScreenMenuOpen = false
        },
        setRoundTimeLength(minutes: number) {
            this.roundTimeLength = minToMs(minutes)
        },
    },
    // getters: {
    //     timeRemainaing: (state) => (roundStart: number) => {
    //         return endTime - Date.now()
    //     }
    // },
})

function minToMs(minutes: number) {
    return minutes * 60 * 1000
}
