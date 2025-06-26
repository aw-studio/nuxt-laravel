import { ref, type Ref } from 'vue'
import { useAsyncData } from 'nuxt/app'
import { useLaravelApi } from './useLaravelApi'

type ModelResponse<T> = { data: T }

export async function useLaravelGet<T extends Record<string, any>>(
    endpoint: string
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
