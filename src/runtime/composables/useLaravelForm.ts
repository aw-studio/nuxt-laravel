import {
    useForm,
    useField,
    // type FieldMeta,
    // type FieldOptions,
} from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { reactive } from 'vue'
// import type { Ref } from 'vue'
import type { ErrorBag, FormError, LaravelFormOptions } from '../types'
import { useLaravelApi } from './useLaravelApi'

// export type Fields<T> = { [K in keyof T]: Ref<T[K]> }
// export type FieldProps<T> = { [K in keyof T]: FieldOptions<T[K]> }
// export type FieldMetaMap<T> = { [K in keyof T]: FieldMeta<T[K]> }

export type LaravelForm<TForm extends Record<string, any>> = ReturnType<
    typeof useForm<TForm>
> & {
    fields: { [K in keyof TForm]: any }
    fieldProps: { [K in keyof TForm]: any }
    fieldMeta: { [K in keyof TForm]: any }
    submit: () => Promise<any>
}

export function useLaravelForm<TForm extends Record<string, any>>(
    options: LaravelFormOptions<TForm>
): LaravelForm<TForm> {
    const {
        initialValues,
        submitUrl,
        schema,
        method = 'POST',
        onSubmitSuccess,
        onSubmitError,
    } = options

    const formSchema = toTypedSchema(schema)

    const form = useForm({
        name: `${submitUrl}__${method.toLowerCase()}`,
        validationSchema: formSchema,
        initialValues,
    })

    const { values, setFieldError, defineField, handleSubmit } = form

    const fields = reactive({}) as {
        [K in keyof TForm]: any
    }
    const fieldProps = reactive({}) as { [K in keyof TForm]: any }
    const fieldMeta = reactive({}) as { [K in keyof TForm]: any }

    for (const key of Object.keys(initialValues) as (keyof TForm)[]) {
        const [field, props] = defineField(key as string)
        const { meta } = useField(() => key as string)

        fields[key] = field
        fieldProps[key] = props
        fieldMeta[key] = meta
    }

    const submit = handleSubmit(async () => {
        const { post, put, patch, destroy } = useLaravelApi()

        try {
            let response
            if (method === 'POST') {
                response = await post(submitUrl, values)
            } else if (method === 'PUT') {
                response = await put(submitUrl, values)
            } else if (method === 'PATCH') {
                response = await patch(submitUrl, values)
            } else if (method === 'DELETE') {
                response = await destroy(submitUrl, values)
            } else {
                throw new Error(`Unsupported method: ${method}`)
            }

            if (onSubmitSuccess) {
                onSubmitSuccess(response)
            }
            return response
        } catch (error: any) {
            if (onSubmitError) {
                onSubmitError(error as FormError)
            }

            /**
             * Handle validation errors
             */
            if (error.response?.data?.errors || error.response?._data?.errors) {
                const validationError: ErrorBag =
                    error.response.data?.errors || error.response._data?.errors

                for (const field in validationError) {
                    const errorMessages = validationError[field]

                    if (Array.isArray(errorMessages)) {
                        errorMessages.forEach(message => {
                            // If it's an array, set each error message for the field
                            setFieldError(field, message)
                        })
                    } else {
                        // If it's not an array, set it directly
                        setFieldError(field, errorMessages)
                    }
                }
            }

            throw error
        }
    })

    return {
        ...(form as ReturnType<typeof useForm<TForm>>),
        fields,
        fieldProps,
        fieldMeta,
        submit,
    } as LaravelForm<TForm>
}
