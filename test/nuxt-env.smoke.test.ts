// @vitest-environment nuxt
import { describe, it, expect } from 'vitest'
import { useLaravelConfig } from '../src/runtime/composables/useLaravelConfig'

describe('nuxt test environment', () => {
    it('resolves #imports and the module runtime config', () => {
        expect(useLaravelConfig().baseUrl).toBe('http://laravel.test')
    })
})
