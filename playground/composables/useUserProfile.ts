export type UserProfile = {
    id: string
    name: string
    email: string
}

export type UserProfileForm = Omit<UserProfile, 'id'>

// ✅ Valid composable
export const useUserProfile = () => {
    const userProfile = useState('user-profile', () => null)
    const isLoaded = useState('user-profile-loaded', () => false)

    const load = async () => {
        if (isLoaded.value) return

        const { get } = useLaravelApi()
        const data = await get('/api/user')

        userProfile.value = data
        isLoaded.value = true
    }

    return {
        userProfile,
        isLoaded,
        load,
    }
}
