import { computed, ref, type ComputedRef, type Ref } from 'vue'
import { useAsyncData } from 'nuxt/app'
import type { LaravelGetOptions, ModelResponse } from '../types'
import { useLaravelApi } from './useLaravelApi'

export async function useLaravelGet<T extends Record<string, any>>(
    endpoint: string,
    options?: LaravelGetOptions
): Promise<{
    loading: Ref<boolean>
    data: ComputedRef<T | null>
    error: Ref<any>
    refresh: () => Promise<void>
}> {
    const loading = ref(false)

    // If options.query is provided, append it to the endpoint
    if (options?.query) {
        const queryParams = new URLSearchParams(options.query).toString()
        endpoint = `${endpoint}?${queryParams}`
    }

    const load = async () => {
        const { get } = useLaravelApi()
        loading.value = true

        try {
            const response: ModelResponse<T> = await get(endpoint)

            return response.data
        } finally {
            // Runs on the failure path too. The rejection propagates to
            // useAsyncData, which records it on `error` for the caller.
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
        // useAsyncData yields `undefined` when the request fails. Normalising
        // to null keeps the declared type honest - it was previously cast to
        // `Ref<T | null>`, which was simply untrue on the error path.
        data: computed<T | null>(() => (data.value as T | undefined) ?? null),
        error,
        refresh,
    }
}
