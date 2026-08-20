// @vitest-environment nuxt
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useNuxtApp } from 'nuxt/app'
import { useLaravelGet } from '../src/runtime/composables/useLaravelGet'

/**
 * Fetching a single model. Coverage showed this composable at 0% — it is the
 * one piece of the runtime that had never been executed by a test.
 */

const api = vi.fn()

beforeEach(() => {
    api.mockReset()
    api.mockResolvedValue({ data: { id: 1, name: 'Shirt' } })
    ;(useNuxtApp() as Record<string, unknown>).$apiFetch = api
})

const lastUrl = () => String(api.mock.calls.at(-1)?.[0] ?? '')

let n = 0
const uniqueEndpoint = () => `/api/products/${++n}`

describe('fetching', () => {
    it('unwraps the resource envelope', async () => {
        const { data } = await useLaravelGet<{ id: number, name: string }>(
            uniqueEndpoint()
        )

        expect(data.value).toEqual({ id: 1, name: 'Shirt' })
    })

    it('requests the endpoint against the configured base url', async () => {
        const endpoint = uniqueEndpoint()

        await useLaravelGet(endpoint)

        expect(lastUrl()).toBe(`http://laravel.test${endpoint}`)
    })

    it('appends query options to the endpoint', async () => {
        const endpoint = uniqueEndpoint()

        await useLaravelGet(endpoint, { query: { with: 'variants' } })

        expect(decodeURIComponent(lastUrl())).toBe(
            `http://laravel.test${endpoint}?with=variants`
        )
    })

    it('serializes several query params', async () => {
        const endpoint = uniqueEndpoint()

        await useLaravelGet(endpoint, {
            query: { with: 'variants', locale: 'de' },
        })

        const url = decodeURIComponent(lastUrl())
        expect(url).toContain('with=variants')
        expect(url).toContain('locale=de')
    })

    it('shares state per endpoint between call sites', async () => {
        const endpoint = uniqueEndpoint()

        const first = await useLaravelGet<{ id: number, name: string }>(endpoint)
        const second = await useLaravelGet<{ id: number, name: string }>(endpoint)

        // useAsyncData keys on the endpoint, so two components asking for the
        // same model read the same state.
        //
        // Deliberately not asserting the request count: Nuxt 4 dedupes a repeat
        // call against the resolved key while Nuxt 3 refetches, so that would
        // pass on one major and fail on the other.
        expect(second.data.value).toEqual(first.data.value)
        expect(second.data.value).toEqual({ id: 1, name: 'Shirt' })
    })
})

describe('refresh', () => {
    it('refetches on demand', async () => {
        const { refresh, data } = await useLaravelGet<{ id: number, name: string }>(
            uniqueEndpoint()
        )
        expect(api).toHaveBeenCalledTimes(1)

        api.mockResolvedValue({ data: { id: 1, name: 'Changed' } })
        await refresh()

        expect(api).toHaveBeenCalledTimes(2)
        expect(data.value).toEqual({ id: 1, name: 'Changed' })
    })
})

describe('errors', () => {
    it('surfaces a failure through the error ref rather than throwing', async () => {
        api.mockRejectedValue(new Error('Not found'))

        const { error, data } = await useLaravelGet(uniqueEndpoint())

        expect(error.value).toBeTruthy()
        expect(data.value).toBeNull()
    })

    it('leaves loading false once settled', async () => {
        const { loading } = await useLaravelGet(uniqueEndpoint())

        expect(loading.value).toBe(false)
    })
})
