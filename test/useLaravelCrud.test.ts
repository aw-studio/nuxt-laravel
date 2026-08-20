// @vitest-environment nuxt
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useNuxtApp } from 'nuxt/app'
import { z } from 'zod'
import { useLaravelCrud } from '../src/runtime/composables/useLaravelCrud'

/**
 * `useLaravelCrud` is thin, but the thing it owns — which URL and verb each
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

const crud = (overrides: Record<string, any> = {}) =>
    useLaravelCrud<{ id: number, name: string }, { name: string }>({
        endpoint: '/api/products',
        schema,
        initialValues,
        ...overrides,
    })

describe('endpoint and verb resolution', () => {
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
        const form = crud().destroy(7)

        await form.submit()

        expect(lastUrl()).toBe('http://laravel.test/api/products/7')
        expect(lastMethod()).toBe('DELETE')
    })

    it('builds an index over the collection endpoint', async () => {
        const index = crud().index({ syncUrl: false, key: 'crud-index-test' })

        api.mockResolvedValue({ data: [], meta: undefined })
        await index.load()

        expect(String(lastUrl())).toContain('/api/products')
    })

    it('exposes the resolver so callers can check a url', () => {
        expect(crud().buildEndpoint('update', { id: 7 })).toBe('/api/products/7')
        expect(crud().buildEndpoint('index')).toBe('/api/products')
    })
})

describe('url prefixes', () => {
    it('applies a resource-level prefix', async () => {
        const form = crud({ urlPrefix: '/admin' }).create()
        form.setValues({ name: 'Shirt' })

        await form.submit()

        expect(lastUrl()).toBe('http://laravel.test/admin/api/products')
    })

    it('applies a per-call prefix', async () => {
        const form = crud().create({ urlPrefix: '/admin' })
        form.setValues({ name: 'Shirt' })

        await form.submit()

        expect(lastUrl()).toBe('http://laravel.test/admin/api/products')
    })

    it('prefixes member endpoints too', async () => {
        const form = crud().update({ id: 7, name: 'Shirt' }, { urlPrefix: '/admin' })

        await form.submit()

        expect(lastUrl()).toBe('http://laravel.test/admin/api/products/7')
    })

    it('does not produce double slashes', async () => {
        const form = crud({ urlPrefix: '/admin/' }).create()
        form.setValues({ name: 'Shirt' })

        await form.submit()

        expect(lastUrl()).not.toContain('//api')
    })
})

describe('per-operation overrides', () => {
    it('uses an overridden endpoint', async () => {
        const form = crud({ create: { endpoint: '/api/products/import' } }).create()
        form.setValues({ name: 'Shirt' })

        await form.submit()

        expect(lastUrl()).toBe('http://laravel.test/api/products/import')
    })

    it('substitutes :id in an overridden endpoint', async () => {
        const form = crud({
            update: { endpoint: '/api/products/:id/publish' },
        }).update({ id: 7, name: 'Shirt' })

        await form.submit()

        expect(lastUrl()).toBe('http://laravel.test/api/products/7/publish')
    })

    it('falls back to the shared schema when none is given', async () => {
        const form = crud().create()
        form.setValues({ name: '' })

        await expect(form.submit()).rejects.toBeTruthy()
        expect(api).not.toHaveBeenCalled()
    })

    it('prefers a per-operation schema', async () => {
        const form = crud({
            update: { schema: z.object({ name: z.string().min(5) }) },
        }).update({ id: 7, name: 'abc' })

        await expect(form.submit()).rejects.toBeTruthy()
        expect(api).not.toHaveBeenCalled()
    })

    it('merges extra methods into the returned object', () => {
        const publish = vi.fn()
        const resource = crud({ methods: { publish } }) as unknown as {
            publish: () => void
        }

        resource.publish()

        expect(publish).toHaveBeenCalled()
    })
})

describe('misconfiguration', () => {
    it('throws when a member operation is called without an id', () => {
        expect(() => crud().destroy(undefined as unknown as number)).toThrow(
            /Missing 'id'/
        )
    })

    it('throws when an :id endpoint is used without an id', () => {
        expect(() =>
            crud({ destroy: { endpoint: '/api/products/:id/archive' } }).destroy(
                undefined as unknown as number
            )
        ).toThrow(/Missing 'id'/)
    })

    it('throws when no endpoint is configured at all', () => {
        const bare = useLaravelCrud<{ id: number }, { name: string }>({
            schema,
            initialValues,
        })

        expect(() => bare.create()).toThrow(/No endpoint configured/)
    })
})

describe('destroy semantics', () => {
    it('does not validate the delete against the create schema', async () => {
        // DELETE sends no meaningful body. Inheriting the create schema would
        // validate `{}` against it and reject every delete.
        const form = crud().destroy(7)

        await form.submit()

        expect(lastMethod()).toBe('DELETE')
    })

    it('still honours an explicit schema on destroy', async () => {
        const form = crud({
            destroy: {
                schema: z.object({ reason: z.string().min(1) }),
                initialValues: { reason: '' } as any,
            },
        }).destroy(7)

        await expect(form.submit()).rejects.toBeTruthy()
        expect(api).not.toHaveBeenCalled()
    })
})
