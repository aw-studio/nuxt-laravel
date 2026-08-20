import type { ModuleOptions } from '../types'
import { useRuntimeConfig } from '#imports'

export const useLaravelConfig = (): ModuleOptions => {
    return useRuntimeConfig().public.laravel as ModuleOptions
}
