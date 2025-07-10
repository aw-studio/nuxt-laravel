export default defineNuxtConfig({
    modules: ['../src/module'],
    ssr: true,
    laravel: {
        baseUrl: 'http://localhost:8000',
        sanctum: {
            redirectAuthenticated: '/dashboard',
            redirectUnauthenticated: '/login',
        },
        // reverb: {
        //     appKey: 'm3tx8tkuw5beqynefafg',
        //     host: 'localhost',
        //     wsPort: 8080,
        //     wssPort: 8080,
        // },
    },
    devtools: { enabled: true },
})
