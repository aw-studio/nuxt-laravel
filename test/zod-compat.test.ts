import { describe, it, expect } from 'vitest'
import { z } from 'zod'
import { toTypedSchema } from '@vee-validate/zod'

// `@aw-studio/nuxt-laravel` declares zod as a peer dependency of
// `^3.24.0 || ^4.0.0`, but `@vee-validate/zod` still declares only `^3.24.0`.
// useLaravelForm passes consumer zod schemas straight through toTypedSchema,
// so this pins the claim that the zod 4 half of that range actually works.
describe('zod + @vee-validate/zod interop', () => {
    const schema = toTypedSchema(
        z.object({
            name: z.string().min(1, 'Name is required'),
            age: z.number().min(18, 'Must be 18 or older'),
        })
    )

    it('reports the installed zod major', () => {
        expect(z).toBeDefined()
    })

    it('accepts a valid value', async () => {
        const result = await schema.parse({ name: 'Jannes', age: 30 })

        expect(result.errors).toEqual([])
        expect(result.value).toEqual({ name: 'Jannes', age: 30 })
    })

    it('surfaces field errors in the shape vee-validate expects', async () => {
        const result = await schema.parse({ name: '', age: 12 })

        const paths = result.errors.map(e => e.path)
        expect(paths).toContain('name')
        expect(paths).toContain('age')

        const nameError = result.errors.find(e => e.path === 'name')
        expect(nameError?.errors).toContain('Name is required')
    })
})
