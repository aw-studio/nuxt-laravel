export default defineNuxtRouteMiddleware(async () => {
    const { csrf } = useLaravelSanctum()
    await csrf()

    const { userProfile, load } = useUserProfile()

    if (userProfile.value) {
        return
    }

    try {
        await load()
        return navigateTo('/dashboard')
    } catch (error) {
        console.error('Error during guest middleware:', error)
        return
    }
})
