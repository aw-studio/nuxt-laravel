// @vitest-environment nuxt
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useNuxtApp } from 'nuxt/app'
import { z } from 'zod'
import { useLaravelForm } from '../src/runtime/composables/useLaravelForm'

/**
 * `useLaravelForm` wraps vee-validate with two module-specific jobs: sending the
 * values through `useLaravelApi`, and mapping a Laravel 422 body back onto the
 * individual fields. Neither had coverage.
 */

const api = vi.fn()

beforeEach(() => {
    api.mockReset()
    api.mockResolvedValue({ data: { id: 1 } })
    ;(useNuxtApp() as Record<string, unknown>).$apiFetch = api
})

const lastCall = () => api.mock.calls.at(-1) as unknown as [string, any]

const schema = z.object({
    name: z.string().min(1, 'Name is required'),
    email: z.string().email('Must be a valid email'),
})

const valid = { name: 'Zaphod', email: 'z@example.test' }

const makeForm = (overrides: Record<string, any> = {}) =>
    useLaravelForm<{ name: string, email: string }>({
        initialValues: { name: '', email: '' },
        submitUrl: '/api/users',
        schema,
        ...overrides,
    })

describe('field wiring', () => {
    it('exposes a field, props and meta for every initial value', () => {
        const form = makeForm()

        expect(Object.keys(form.fields).sort()).toEqual(['email', 'name'])
        expect(Object.keys(form.fieldProps).sort()).toEqual(['email', 'name'])
        expect(Object.keys(form.fieldMeta).sort()).toEqual(['email', 'name'])
    })

    it('seeds the form with the initial values', () => {
        const form = useLaravelForm<{ name: string, email: string }>({
            initialValues: valid,
            submitUrl: '/api/users',
            schema,
        })

        expect(form.values).toEqual(valid)
    })
})

describe('submitting', () => {
    it('posts the current values to the submit url', async () => {
        const form = makeForm()
        form.setValues(valid)

        await form.submit()

        expect(lastCall()[0]).toBe('http://laravel.test/api/users')
        expect(lastCall()[1].method).toBe('POST')
        expect(lastCall()[1].body).toEqual(valid)
    })

    it.each([
        ['POST', 'POST'],
        ['PUT', 'PUT'],
        ['PATCH', 'PATCH'],
        ['DELETE', 'DELETE'],
    ])('maps method %s onto the request', async (method, expected) => {
        const form = makeForm({ method })
        form.setValues(valid)

        await form.submit()

        expect(lastCall()[1].method).toBe(expected)
    })

    it('calls onSubmitSuccess with the response', async () => {
        const onSubmitSuccess = vi.fn()
        const form = makeForm({ onSubmitSuccess })
        form.setValues(valid)

        await form.submit()

        expect(onSubmitSuccess).toHaveBeenCalledWith({ data: { id: 1 } })
    })
})

describe('client-side validation', () => {
    it('does not send anything when the schema fails', async () => {
        const form = makeForm()
        form.setValues({ name: '', email: 'not-an-email' })

        await expect(form.submit()).rejects.toBeTruthy()

        expect(api).not.toHaveBeenCalled()
    })

    it('surfaces the schema messages on the fields', async () => {
        const form = makeForm()
        form.setValues({ name: '', email: 'not-an-email' })

        await form.submit().catch(() => {})

        expect(form.errors.value.name).toBe('Name is required')
        expect(form.errors.value.email).toBe('Must be a valid email')
    })

    it('submits once the values become valid', async () => {
        const form = makeForm()
        form.setValues({ name: '', email: 'nope' })
        await form.submit().catch(() => {})
        expect(api).not.toHaveBeenCalled()

        form.setValues(valid)
        await form.submit()

        expect(api).toHaveBeenCalledTimes(1)
    })
})

describe('Laravel validation errors', () => {
    const laravel422 = (errors: Record<string, string[]>) => ({
        response: {
            status: 422,
            _data: { message: 'The given data was invalid.', errors },
        },
    })

    it('maps a 422 error bag onto the matching fields', async () => {
        const form = makeForm()
        form.setValues(valid)
        api.mockRejectedValue(
            laravel422({ email: ['The email has already been taken.'] })
        )

        await form.submit().catch(() => {})

        expect(form.errors.value.email).toBe('The email has already been taken.')
    })

    it('maps errors for several fields at once', async () => {
        const form = makeForm()
        form.setValues(valid)
        api.mockRejectedValue(
            laravel422({
                name: ['The name is invalid.'],
                email: ['The email is invalid.'],
            })
        )

        await form.submit().catch(() => {})

        expect(form.errors.value.name).toBe('The name is invalid.')
        expect(form.errors.value.email).toBe('The email is invalid.')
    })

    it('accepts a plain string instead of an array of messages', async () => {
        const form = makeForm()
        form.setValues(valid)
        api.mockRejectedValue(
            laravel422({ email: 'Not an array' } as unknown as Record<string, string[]>)
        )

        await form.submit().catch(() => {})

        expect(form.errors.value.email).toBe('Not an array')
    })

    it('rethrows so the caller can react', async () => {
        const form = makeForm()
        form.setValues(valid)
        api.mockRejectedValue(laravel422({ email: ['taken'] }))

        await expect(form.submit()).rejects.toBeTruthy()
    })

    it('calls onSubmitError', async () => {
        const onSubmitError = vi.fn()
        const form = makeForm({ onSubmitError })
        form.setValues(valid)
        api.mockRejectedValue(laravel422({ email: ['taken'] }))

        await form.submit().catch(() => {})

        expect(onSubmitError).toHaveBeenCalledTimes(1)
    })

    it('reads errors from response.data as well as response._data', async () => {
        // ofetch exposes the parsed body as `_data`; some setups surface `data`.
        // The composable checks both, so both are pinned here.
        const form = makeForm()
        form.setValues(valid)
        api.mockRejectedValue({
            response: { status: 422, data: { errors: { name: ['From data'] } } },
        })

        await form.submit().catch(() => {})

        expect(form.errors.value.name).toBe('From data')
    })

    it('does not invent field errors for a non-validation failure', async () => {
        const form = makeForm()
        form.setValues(valid)
        api.mockRejectedValue({ response: { status: 500, _data: { message: 'Boom' } } })

        await form.submit().catch(() => {})

        expect(form.errors.value.name).toBeUndefined()
        expect(form.errors.value.email).toBeUndefined()
    })
})
