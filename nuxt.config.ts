// https://nuxt.com/docs/api/configuration/nuxt-config
import tailwindTypography from '@tailwindcss/typography'
import { defineNuxtConfig } from 'nuxt/config'

export default defineNuxtConfig({
    app: {
        head: {
            title: 'w1 Tournament Tracker',
            charset: 'utf-8',
            viewport: 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no',
            link: [
                {
                    rel: 'icon',
                    type: 'image/x-icon',
                    href: '/favicon.ico',
                },
                {
                    rel: 'manifest',
                    href: '/manifest.webmanifest',
                },
            ],
        },
    },
    devtools: { enabled: true },
    modules: [
        '@nuxt/content',
        '@nuxtjs/tailwindcss',
        '@nuxt/image',
        '@pinia/nuxt',
        '@pinia-plugin-persistedstate/nuxt',
    ],
    pinia: {
        storesDirs: ['./stores/**'],
    },
    tailwindcss: {
        config: {
            plugins: [tailwindTypography],
        },
    },
    piniaPersistedstate: {
        cookieOptions: {
            sameSite: 'strict',
        },
        storage: 'localStorage',
    },
    // @ts-ignore
    manifest: {
        fileName: 'manifest.webmanifest',
    },
})
