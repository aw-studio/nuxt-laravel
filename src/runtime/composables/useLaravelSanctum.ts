import { computed, ref } from 'vue'
import { useState } from 'nuxt/app'
import type { SanctumCredentials, SanctumOptions } from '../types'
import { useLaravelApi } from './useLaravelApi'

/**
 * Sanctum SPA (cookie) authentication.
 *
 * This is stateful cookie auth, not token auth: the browser holds a session
 * cookie, and every request carries it plus the `X-XSRF-TOKEN` header that
 * `useLaravelApi` mirrors from the `XSRF-TOKEN` cookie.
 *
 * The endpoints default to Laravel's conventional routes and can be pointed
 * elsewhere — a separate guard, for instance — via the options.
 */
export const useLaravelSanctum = <TUser extends Record<string, any> = Record<string, any>>(
    options: SanctumOptions = {}
) => {
    const {
        csrfEndpoint = 'sanctum/csrf-cookie',
        loginEndpoint = '/login',
        logoutEndpoint = '/logout',
        userEndpoint = '/api/user',
        key = 'laravel-sanctum-user',
    } = options

    const { get, post } = useLaravelApi()

    const user = useState<TUser | null>(key, () => null)
    const loading = ref(false)

    const isAuthenticated = computed(() => user.value !== null)

    /**
     * Prime the CSRF cookie. Required before the first stateful request.
     */
    const csrf = async () => {
        await get(csrfEndpoint)
    }

    /**
     * Fetch the authenticated user, or null when unauthenticated.
     *
     * A 401 is the expected answer for a guest, so it resolves to null rather
     * than throwing — callers should not have to try/catch to ask "is anyone
     * logged in".
     */
    const fetchUser = async (): Promise<TUser | null> => {
        loading.value = true

        try {
            const response = await get(userEndpoint)

            // Tolerate both a bare model and a resource envelope.
            user.value = (response?.data ?? response) as TUser
        } catch (error: any) {
            if (error?.response?.status === 401 || error?.response?.status === 419) {
                user.value = null
            } else {
                throw error
            }
        } finally {
            loading.value = false
        }

        return user.value
    }

    /**
     * Log in, priming the CSRF cookie first.
     */
    const login = async (credentials: SanctumCredentials) => {
        await csrf()

        const response = await post(loginEndpoint, credentials)

        await fetchUser()

        return response
    }

    /**
     * Log out and clear the cached user.
     *
     * The local user is cleared even if the request fails — the session is not
     * usable either way, and leaving a stale user in state is worse than an
     * optimistic clear.
     */
    const logout = async () => {
        try {
            return await post(logoutEndpoint, {})
        } finally {
            user.value = null
        }
    }

    return {
        user,
        loading,
        isAuthenticated,
        csrf,
        login,
        logout,
        fetchUser,
    }
}

export default useLaravelSanctum
