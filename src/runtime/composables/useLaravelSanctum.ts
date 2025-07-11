import * as z from 'zod'
import { useRouter } from 'nuxt/app'
import type { LoginForm, RegisterRequest } from '../types'
import { useLaravelApi } from './useLaravelApi'
import { useLaravelForm } from './useLaravelForm'
import { useLaravelConfig } from './useLaravelConfig'

export const useLaravelSanctum = () => {
    const { client } = useLaravelApi()
    const config = useLaravelConfig()
    const router = useRouter()

    const csrf = async () => {
        await client.get('sanctum/csrf-cookie')
    }

    const loginSchema = z.object({
        email: z.string().email(),
        password: z.string().min(6),
    })

    const login = () => {
        return useLaravelForm<LoginForm>({
            initialValues: {
                email: '',
                password: '',
            },
            submitUrl: '/login',
            schema: loginSchema,
            onSubmitSuccess: async () => {
                const redirectTo = config.sanctum?.redirectAuthenticated || '/'
                await router.push(redirectTo)
            },
        })
    }

    const registerSchema = z.object({
        name: z.string().min(1),
        email: z.string().email(),
        password: z.string().min(6),
        password_confirmation: z.string().min(6),
    })

    const register = () => {
        return useLaravelForm<RegisterRequest>({
            initialValues: {
                name: '',
                email: '',
                password: '',
                password_confirmation: '',
            },
            submitUrl: '/register',
            schema: registerSchema,
            onSubmitSuccess: async () => {
                const redirectTo = config.sanctum?.redirectAuthenticated || '/'
                await router.push(redirectTo)
            },
        })
    }

    const logout = async () => {
        try {
            await client.post('/logout', {})
            const redirectTo = config.sanctum?.redirectUnauthenticated || '/'
            router.push(redirectTo)
        } catch (error) {
            console.error(error)
        }
    }

    return {
        csrf,
        login,
        register,
        logout,
    }
}
