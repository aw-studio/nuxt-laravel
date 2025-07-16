export default defineNuxtConfig({
    modules: ['../src/module'],
    ssr: true,
    laravel: {
        baseUrl: 'http://localhost:8000',
    },
    devtools: { enabled: true },
})
