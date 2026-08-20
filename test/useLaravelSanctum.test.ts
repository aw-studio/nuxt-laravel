// @vitest-environment nuxt
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useNuxtApp } from 'nuxt/app'
import { useLaravelSanctum } from '../src/runtime/composables/useLaravelSanctum'

/**
 * Sanctum SPA cookie auth. The module previously exposed only csrf(), so the
 * playground called a logout() that did not exist.
 */

const api = vi.fn()

beforeEach(() => {
    api.mockReset()
    api.mockResolvedValue({})
    ;(useNuxtApp() as Record<string, unknown>).$apiFetch = api
})

const calls = () =>
    api.mock.calls.map(([url, opts]) => `${opts.method} ${url}`)

let keyCounter = 0
const uniqueKey = () => `sanctum-test-${++keyCounter}`

const sanctum = (options: Record<string, unknown> = {}) =>
    useLaravelSanctum({ key: uniqueKey(), ...options })

describe('csrf', () => {
    it('primes the cookie from the sanctum route', async () => {
        await sanctum().csrf()

        expect(calls()).toEqual(['GET http://laravel.test/sanctum/csrf-cookie'])
    })
})

describe('login', () => {
    it('primes CSRF before posting credentials', async () => {
        await sanctum().login({ email: 'a@example.test', password: 'secret' })

        // Order matters: posting before the cookie exists is a 419.
        expect(calls()[0]).toBe('GET http://laravel.test/sanctum/csrf-cookie')
        expect(calls()[1]).toBe('POST http://laravel.test/login')
    })

    it('sends the credentials as the body', async () => {
        await sanctum().login({ email: 'a@example.test', password: 'secret' })

        const post = api.mock.calls.find(([, o]) => o.method === 'POST')

        expect(post?.[1].body).toEqual({
            email: 'a@example.test',
            password: 'secret',
        })
    })

    it('loads the user afterwards', async () => {
        const auth = sanctum()
        api.mockImplementation((url: string) =>
            url.endsWith('/api/user')
                ? Promise.resolve({ data: { id: 1, name: 'Zaphod' } })
                : Promise.resolve({})
        )

        await auth.login({ email: 'a@example.test', password: 'secret' })

        expect(auth.user.value).toEqual({ id: 1, name: 'Zaphod' })
        expect(auth.isAuthenticated.value).toBe(true)
    })
})

describe('fetchUser', () => {
    it('unwraps a resource envelope', async () => {
        const auth = sanctum()
        api.mockResolvedValue({ data: { id: 1, name: 'Zaphod' } })

        await auth.fetchUser()

        expect(auth.user.value).toEqual({ id: 1, name: 'Zaphod' })
    })

    it('accepts a bare model too', async () => {
        const auth = sanctum()
        api.mockResolvedValue({ id: 1, name: 'Zaphod' })

        await auth.fetchUser()

        expect(auth.user.value).toMatchObject({ id: 1, name: 'Zaphod' })
    })

    it('resolves to null for a guest rather than throwing', async () => {
        const auth = sanctum()
        // 401 is the expected answer for a guest. Callers should not have to
        // try/catch to ask whether anyone is logged in.
        api.mockRejectedValue({ response: { status: 401 } })

        await expect(auth.fetchUser()).resolves.toBeNull()

        expect(auth.user.value).toBeNull()
        expect(auth.isAuthenticated.value).toBe(false)
    })

    it('treats an expired session (419) as unauthenticated', async () => {
        const auth = sanctum()
        api.mockRejectedValue({ response: { status: 419 } })

        await expect(auth.fetchUser()).resolves.toBeNull()
    })

    it('rethrows a genuine failure', async () => {
        const auth = sanctum()
        api.mockRejectedValue({ response: { status: 500 } })

        await expect(auth.fetchUser()).rejects.toBeTruthy()
    })

    it('clears loading even when the request fails', async () => {
        const auth = sanctum()
        api.mockRejectedValue({ response: { status: 500 } })

        await auth.fetchUser().catch(() => {})

        expect(auth.loading.value).toBe(false)
    })
})

describe('logout', () => {
    it('posts to the logout route', async () => {
        await sanctum().logout()

        expect(calls()).toEqual(['POST http://laravel.test/logout'])
    })

    it('clears the cached user', async () => {
        const auth = sanctum()
        api.mockResolvedValue({ data: { id: 1 } })
        await auth.fetchUser()
        expect(auth.isAuthenticated.value).toBe(true)

        api.mockResolvedValue({})
        await auth.logout()

        expect(auth.user.value).toBeNull()
        expect(auth.isAuthenticated.value).toBe(false)
    })

    it('clears the user even if the request fails', async () => {
        const auth = sanctum()
        api.mockResolvedValue({ data: { id: 1 } })
        await auth.fetchUser()

        api.mockRejectedValue({ response: { status: 500 } })
        await auth.logout().catch(() => {})

        // The session is unusable either way; a stale user in state is worse
        // than an optimistic clear.
        expect(auth.user.value).toBeNull()
    })
})

describe('endpoints', () => {
    it('can point at a different guard', async () => {
        const auth = sanctum({
            loginEndpoint: '/member/login',
            logoutEndpoint: '/member/logout',
            userEndpoint: '/api/member',
        })

        await auth.login({ email: 'a@example.test', password: 'x' })
        await auth.logout()

        expect(calls()).toContain('POST http://laravel.test/member/login')
        expect(calls()).toContain('GET http://laravel.test/api/member')
        expect(calls()).toContain('POST http://laravel.test/member/logout')
    })

    it('keeps separate guards in separate state', async () => {
        const staff = sanctum({ key: 'guard-staff' })
        const member = sanctum({ key: 'guard-member' })

        api.mockResolvedValue({ data: { id: 1, name: 'Staff' } })
        await staff.fetchUser()

        expect(staff.isAuthenticated.value).toBe(true)
        expect(member.user.value).toBeNull()
    })
})
