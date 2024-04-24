import { defineStore } from 'pinia'

export const useUiStore = defineStore('ui', {
    state: () => ({
        isFullScreenMenuOpen: false,
        dataFetchStatus: '',
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
    },
})
