import { ref, type Ref } from 'vue'
import { useAsyncData } from 'nuxt/app'
import type { LaravelGetOptions, ModelResponse } from '../types'
import { useLaravelApi } from './useLaravelApi'

export async function useLaravelGet<T extends Record<string, any>>(
    endpoint: string,
    options?: LaravelGetOptions
): Promise<{
    loading: Ref<boolean>
    data: Ref<T | null>
    error: Ref<any>
    refresh: () => Promise<void>
}> {
    const loading = ref(false)

    const load = async () => {
        const { get } = useLaravelApi()
        loading.value = true

        // If options.query is provided, append it to the endpoint
        if (options?.query) {
            const queryParams = new URLSearchParams(options.query).toString()
            endpoint = `${endpoint}?${queryParams}`
        }

        try {
            const response: ModelResponse<T> = await get(endpoint)
            return response.data
        } catch (error) {
            console.error('Error loading model:', error)
            throw error
        } finally {
            // Ensure loading is set to false even if an error occurs
            loading.value = false
        }
    }

    const { data, error, refresh } = await useAsyncData<T>(
        endpoint,
        async () => {
            return await load()
        }
    )

    return {
        loading,
        data: data as Ref<T | null>,
        error,
        refresh,
    }
}
