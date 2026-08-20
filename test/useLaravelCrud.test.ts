// @vitest-environment nuxt
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useNuxtApp } from 'nuxt/app'
import { z } from 'zod'
import { useLaravelCrud } from '../src/runtime/composables/useLaravelCrud'
import { useLaravelCrudResource } from '../src/runtime/composables/useLaravelCrudResource'

/**
 * Both CRUD helpers are thin, but the thing they own — which URL and verb each
 * operation resolves to — is exactly the kind of logic that breaks silently.
 * These assert the resolved request rather than the internals.
 */

const api = vi.fn()

beforeEach(() => {
    api.mockReset()
    api.mockResolvedValue({ data: { id: 1 } })
    ;(useNuxtApp() as Record<string, unknown>).$apiFetch = api
})

const lastCall = () => api.mock.calls.at(-1) as unknown as [string, any]
const lastUrl = () => lastCall()[0]
const lastMethod = () => lastCall()[1].method

const schema = z.object({ name: z.string().min(1) })
const initialValues = { name: '' }

describe('useLaravelCrud', () => {
    const crud = () =>
        useLaravelCrud<{ id: number, name: string }, { id?: number, name: string }>({
            endpoint: '/api/products',
            schema,
            initialValues,
        })

    it('creates with POST to the collection endpoint', async () => {
        const form = crud().create()
        form.setValues({ name: 'Shirt' })

        await form.submit()

        expect(lastUrl()).toBe('http://laravel.test/api/products')
        expect(lastMethod()).toBe('POST')
    })

    it('updates with PUT to the member endpoint', async () => {
        const form = crud().update({ id: 7, name: 'Shirt' })

        await form.submit()

        expect(lastUrl()).toBe('http://laravel.test/api/products/7')
        expect(lastMethod()).toBe('PUT')
    })

    it('destroys with DELETE to the member endpoint', async () => {
        const form = crud().destroy({ id: 7, name: 'Shirt' })

        await form.submit()

        expect(lastUrl()).toBe('http://laravel.test/api/products/7')
        expect(lastMethod()).toBe('DELETE')
    })

    it('honours a per-call endpoint override on create', async () => {
        const form = crud().create('/api/products/import')
        form.setValues({ name: 'Shirt' })

        await form.submit()

        expect(lastUrl()).toBe('http://laravel.test/api/products/import')
    })

    it('honours a per-call endpoint override on update', async () => {
        const form = crud().update({ id: 7, name: 'Shirt' }, '/api/products/7/publish')

        await form.submit()

        expect(lastUrl()).toBe('http://laravel.test/api/products/7/publish')
    })

    it('builds an index over the same endpoint', async () => {
        const index = crud().index({ syncUrl: false, key: 'crud-index-test' })

        api.mockResolvedValue({ data: [], meta: undefined })
        await index.load()

        expect(String(lastUrl())).toContain('/api/products')
    })
})

describe('useLaravelCrudResource', () => {
    const resource = (overrides: Record<string, any> = {}) =>
        useLaravelCrudResource<{ index: { id: number, name: string } }, { create: { name: string } }>({
            config: { endpoint: '/api/products', schema, initialValues },
            ...overrides,
        })

    it('creates with POST to the collection endpoint', async () => {
        const form = resource().create()
        form.setValues({ name: 'Shirt' })

        await form.submit()

        expect(lastUrl()).toBe('http://laravel.test/api/products')
        expect(lastMethod()).toBe('POST')
    })

    it('updates with PUT to the member endpoint', async () => {
        const form = resource().update({ id: 7, name: 'Shirt' })

        await form.submit()

        expect(lastUrl()).toBe('http://laravel.test/api/products/7')
        expect(lastMethod()).toBe('PUT')
    })

    it('destroys with DELETE to the member endpoint', async () => {
        const form = resource().destroy(7)

        await form.submit()

        expect(lastUrl()).toBe('http://laravel.test/api/products/7')
        expect(lastMethod()).toBe('DELETE')
    })

    it('prefixes with urlPrefix', async () => {
        const form = resource().create({ urlPrefix: '/admin' })
        form.setValues({ name: 'Shirt' })

        await form.submit()

        expect(lastUrl()).toBe('http://laravel.test/admin/api/products')
    })

    it('prefixes member endpoints too', async () => {
        const form = resource().update({ id: 7, name: 'Shirt' }, { urlPrefix: '/admin' })

        await form.submit()

        expect(lastUrl()).toBe('http://laravel.test/admin/api/products/7')
    })

    it('uses a per-operation endpoint override', async () => {
        const form = resource({
            create: { endpoint: '/api/products/import' },
        }).create()
        form.setValues({ name: 'Shirt' })

        await form.submit()

        expect(lastUrl()).toBe('http://laravel.test/api/products/import')
    })

    it('substitutes :id in a per-operation endpoint', async () => {
        const form = resource({
            update: { endpoint: '/api/products/:id/publish' },
        }).update({ id: 7, name: 'Shirt' })

        await form.submit()

        expect(lastUrl()).toBe('http://laravel.test/api/products/7/publish')
    })

    it('throws when an :id endpoint is used without an id', () => {
        expect(() =>
            resource({ delete: { endpoint: '/api/products/:id/archive' } }).destroy(
                undefined as unknown as number
            )
        ).toThrow(/Missing 'id'/)
    })

    it('throws when no endpoint is configured at all', () => {
        const bare = useLaravelCrudResource<
            { index: { id: number } },
            { create: { name: string } }
        >({ config: { schema, initialValues } })

        expect(() => bare.create()).toThrow(/No endpoint configured/)
    })

    it('exposes extra methods passed through config', () => {
        const publish = vi.fn()
        const r = resource({ methods: { publish } }) as unknown as {
            publish: () => void
        }

        r.publish()

        expect(publish).toHaveBeenCalled()
    })

    it('falls back to the shared schema and initial values', async () => {
        // No per-operation schema, so the shared one must still validate.
        const form = resource().create()
        form.setValues({ name: '' })

        await expect(form.submit()).rejects.toBeTruthy()
        expect(api).not.toHaveBeenCalled()
    })
})
