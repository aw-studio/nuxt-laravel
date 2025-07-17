import { useLaravelApi } from './useLaravelApi'

export const useLaravelSanctum = () => {
    const { client } = useLaravelApi()

    const csrf = async () => {
        await client.get('sanctum/csrf-cookie')
    }

    return {
        csrf,
    }
}
