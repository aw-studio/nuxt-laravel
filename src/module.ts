import {
    defineNuxtModule,
    createResolver,
    addImportsDir,
    // addPlugin,
} from '@nuxt/kit'
import { defu } from 'defu'

const MODULE_NAME = 'laravel'

export type ModuleOptions = {
    baseUrl: string
}

const defaultModuleOptions: ModuleOptions = {
    baseUrl: 'http://localhost:8000',
}

export * from './runtime/types/index'

export default defineNuxtModule<ModuleOptions>({
    meta: {
        name: MODULE_NAME,
        configKey: 'laravel',
    },
    defaults: defaultModuleOptions,
    setup(_options, _nuxt) {
        const resolver = createResolver(import.meta.url)

        // @ts-expect-error: _nuxt.options.runtimeConfig is not defined in Nuxt 3
        _nuxt.options.runtimeConfig.public.laravel = defu(
            _nuxt.options.runtimeConfig.public.laravel as ModuleOptions,
            _options
        )

        addImportsDir(resolver.resolve('./runtime/composables'))

        // addPlugin(resolver.resolve('./runtime/plugins/echo.client'))
    },
})
