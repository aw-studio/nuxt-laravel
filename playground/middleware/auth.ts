export default defineNuxtRouteMiddleware(async () => {
    const { csrf } = useLaravelSanctum()
    const { isLoaded, load } = useUserProfile()

    if (isLoaded.value) {
        return
    }

    try {
        await csrf()
        await load()
    } catch (error) {
        console.error('Error during authentication middleware:', error)
        return navigateTo('/')
    }
})
