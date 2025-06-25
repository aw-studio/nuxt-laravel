import Echo from 'laravel-echo'
import Pusher from 'pusher-js'
import { useLaravelConfig } from '../composables/useLaravelConfig'
import { useLaravelSanctum } from '../composables/useLaravelSanctum'
import { useLaravelApi } from '../composables/useLaravelApi'
import { defineNuxtPlugin } from '#app'

declare global {
    interface Window {
        Pusher: typeof Pusher
    }
}

window.Pusher = Pusher

export default defineNuxtPlugin(() => {
    const config = useLaravelConfig()
    const { csrf } = useLaravelSanctum()
    const { post } = useLaravelApi()

    if (!config.reverb) {
        return {}
    }

    const broadcastAuth = async (payload: any) => {
        await csrf()
        return await post('/app/broadcasting/auth', JSON.stringify(payload))
    }

    const echo = new Echo({
        broadcaster: 'reverb',
        key: config.reverb.appKey,
        wsHost: config.reverb.host,
        wsPort: config.reverb.wsPort,
        wssPort: config.reverb.wssPort,
        forceTLS: false,
        enabledTransports: ['ws', 'wss'],
        authorizer: (channel: any) => {
            return {
                authorize: (
                    socketId: string,
                    callback: (arg0: any, arg1: any) => void
                ) => {
                    broadcastAuth({
                        socket_id: socketId,
                        channel_name: channel.name,
                    })
                        .then((response: any) => {
                            callback(false, response)
                        })
                        .catch((error: any) => {
                            callback(true, error)
                        })
                },
            }
        },
    })

    return {
        provide: {
            echo: {
                echo,
            },
        },
    }
})
