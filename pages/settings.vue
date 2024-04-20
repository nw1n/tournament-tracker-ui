<script setup>
import { useTournamentStore } from '~/stores/tournament'
import { useSettingsStore } from '@/stores/settings'

const tournament = useTournamentStore()
const settings = useSettingsStore()
</script>

<template>
    <div class="">
        <h1>Settings</h1>
        <div>
            <div class="mt-8">Server URL:</div>
            <input type="text" v-model="settings.serverUrl" class="border p-2 w-64" />
        </div>
        <div>
            <div class="mt-8">Password:</div>
            <input type="text" v-model="settings.password" class="border p-2 w-64" />
        </div>
        <div>
            <div class="mt-8">Debug Mode</div>
            <input type="checkbox" v-model="settings.isDebugMode" />
        </div>
        <div class="pt-6">
            <NuxtLink to="/"><button>Close Settings</button></NuxtLink>
        </div>
    </div>
</template>
<style scoped>
.input-area.has-error input#player {
    background-color: #ffcccc;
}
</style>
