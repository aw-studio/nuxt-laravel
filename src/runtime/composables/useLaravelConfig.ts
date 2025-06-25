import type { ModuleOptions } from '~/src/module'
import { useRuntimeConfig } from '#imports'

export const useLaravelConfig = (): ModuleOptions => {
    return useRuntimeConfig().public.laravel as ModuleOptions
}
