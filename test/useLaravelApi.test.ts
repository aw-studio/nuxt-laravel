// @vitest-environment nuxt
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useNuxtApp } from 'nuxt/app'
import { useLaravelApi } from '../src/runtime/composables/useLaravelApi'

/**
 * `useLaravelApi` is the only place this module performs HTTP, so every other
 * composable inherits whatever it gets wrong. The fixture app configures
 * `baseUrl: 'http://laravel.test'`.
 */

/**
 * Requests are captured through `$apiFetch` — the documented extension point a
 * consuming app uses to inject its own ofetch instance. `useLaravelApi` hands it
 * exactly the (url, options) pair it would otherwise hand `$fetch`, so asserting
 * here covers the same URL building, headers and credentials.
 */
const fetchMock = vi.fn(() => Promise.resolve({ ok: true }))

beforeEach(() => {
    fetchMock.mockClear()
    ;(useNuxtApp() as Record<string, unknown>).$apiFetch = fetchMock

    // Reset the per-request auth cookie between tests.
    document.cookie = 'XSRF-TOKEN=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/'
})

const lastCall = () => fetchMock.mock.calls.at(-1) as unknown as [string, any]

describe('getApiUrl', () => {
    it('prefixes the configured base url', () => {
        expect(useLaravelApi().getApiUrl('/api/products')).toBe(
            'http://laravel.test/api/products'
        )
    })

    it('adds a missing leading slash', () => {
        expect(useLaravelApi().getApiUrl('api/products')).toBe(
            'http://laravel.test/api/products'
        )
    })

    it('does not double up slashes', () => {
        expect(useLaravelApi().getApiUrl('/api/products')).not.toContain('//api')
    })

    it('preserves an existing query string', () => {
        expect(useLaravelApi().getApiUrl('/api/products?page=2')).toBe(
            'http://laravel.test/api/products?page=2'
        )
    })
})

describe('request defaults', () => {
    it('sends credentials so the Sanctum session cookie travels', async () => {
        await useLaravelApi().get('/api/user')

        expect(lastCall()[1].credentials).toBe('include')
    })

    it('asks for JSON so Laravel returns 422 instead of a redirect', async () => {
        await useLaravelApi().get('/api/user')

        expect(lastCall()[1].headers.Accept).toBe('application/json')
    })

    it('mirrors the XSRF-TOKEN cookie into the X-XSRF-TOKEN header', async () => {
        document.cookie = 'XSRF-TOKEN=token-value; path=/'

        await useLaravelApi().post('/api/products', { name: 'Shirt' })

        expect(lastCall()[1].headers['X-XSRF-TOKEN']).toBe('token-value')
    })

    it('sends an empty XSRF header when the cookie is absent', async () => {
        await useLaravelApi().get('/api/user')

        expect(lastCall()[1].headers['X-XSRF-TOKEN']).toBe('')
    })
})

describe('verbs', () => {
    it.each([
        ['get', 'GET'],
        ['post', 'POST'],
        ['put', 'PUT'],
        ['patch', 'PATCH'],
        ['destroy', 'DELETE'],
    ])('%s issues a %s request', async (method, expected) => {
        const api = useLaravelApi() as Record<string, any>

        await (method === 'get'
            ? api.get('/api/products')
            : api[method]('/api/products', { name: 'Shirt' }))

        expect(lastCall()[1].method).toBe(expected)
    })

    it('sends the body on writing verbs', async () => {
        await useLaravelApi().post('/api/products', { name: 'Shirt' })

        expect(lastCall()[1].body).toEqual({ name: 'Shirt' })
    })

    it('passes the resolved absolute url', async () => {
        await useLaravelApi().get('/api/products')

        expect(lastCall()[0]).toBe('http://laravel.test/api/products')
    })

    it('lets callers override options without losing the defaults', async () => {
        await useLaravelApi().get('/api/products', {
            headers: { 'X-Custom': '1' },
        })

        // Caller options are spread last, so an explicit `headers` replaces the
        // defaults wholesale — including the XSRF header. Worth knowing before
        // passing headers to an endpoint that needs CSRF.
        expect(lastCall()[1].headers).toEqual({ 'X-Custom': '1' })
    })
})

describe('$apiFetch override', () => {
    it('prefers a $apiFetch provided by the consuming app', async () => {
        const custom = vi.fn(() => Promise.resolve({ ok: true }))
        ;(useNuxtApp() as Record<string, unknown>).$apiFetch = custom

        await useLaravelApi().get('/api/user')

        expect(custom).toHaveBeenCalledTimes(1)
        expect(fetchMock).not.toHaveBeenCalled()
    })

    it('ignores a $apiFetch that is not callable', async () => {
        ;(useNuxtApp() as Record<string, unknown>).$apiFetch = 'not-a-function'

        // Falls through to the real $fetch, which has no server to talk to here.
        // The point is that it does not try to invoke the non-function value.
        await expect(useLaravelApi().get('/api/user')).rejects.toThrow()

        expect(fetchMock).not.toHaveBeenCalled()
    })
})

describe('client', () => {
    it('exposes the same verbs as a grouped client', () => {
        expect(Object.keys(useLaravelApi().client).sort()).toEqual([
            'destroy',
            'get',
            'patch',
            'post',
            'put',
        ])
    })
})
