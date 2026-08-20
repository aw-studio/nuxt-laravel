import { fileURLToPath } from 'node:url'
import { defineVitestConfig } from '@nuxt/test-utils/config'

// Most tests are plain unit tests and run in the default node environment.
// Composable tests opt into a real Nuxt runtime per-file with:
//
//   // @vitest-environment nuxt
//
// which is what makes `#imports`, auto-imports and `useState` resolve.
//
// The runtime is built from the existing `test/fixtures/basic` app, which
// already registers the module, so the composables see a realistic
// `runtimeConfig.public.laravel`.
export default defineVitestConfig({
    test: {
        coverage: {
            provider: 'v8',
            // The module's runtime is what consumers execute; the build-time
            // module file and generated fixtures are not worth measuring.
            include: ['src/runtime/**/*.ts'],
            reporter: ['text', 'html'],
        },
        environmentOptions: {
            nuxt: {
                rootDir: fileURLToPath(
                    new URL('./test/fixtures/basic', import.meta.url)
                ),
                domEnvironment: 'happy-dom',
            },
        },
    },
})
