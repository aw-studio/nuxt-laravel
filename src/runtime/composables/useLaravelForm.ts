import {
    useForm,
    useField,
    type FieldMeta,
    type FieldOptions,
} from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { reactive } from 'vue'
import type { Ref } from 'vue'
import type { LaravelFormOptions } from '../types'
import { useLaravelApi } from './useLaravelApi'

export type ErrorBag = {
    [key: string]: string | string[]
}
export type ValidationError = {
    errors: ErrorBag
}

export type ExceptionError = {
    exception: string
    file: string
    line: number
    message: string
}
export type FormError = {
    response: {
        data?: ValidationError | ExceptionError
        _data?: ValidationError | ExceptionError
        ok: boolean
        status: number
        statusText: string
        url: string
    }
}

export type Fields<T> = { [K in keyof T]: Ref<T[K]> }
type FieldProps<T> = { [K in keyof T]: FieldOptions<T[K]> }
export type FieldMetaMap<T> = { [K in keyof T]: FieldMeta<T[K]> }

export function useLaravelForm<TForm extends Record<string, any>>(
    options: LaravelFormOptions<TForm>
) {
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

    const fields = reactive({} as Fields<TForm>)
    const fieldProps = reactive({} as FieldProps<TForm>)
    const fieldMeta = reactive({} as FieldMetaMap<TForm>)

    for (const key of Object.keys(initialValues) as (keyof TForm)[]) {
        const [field, props] = defineField(key as string)
        const { meta } = useField(() => key as string)

        // @ts-expect-error Type 'keyof TForm' cannot be used to index type 'Reactive<Fields<TForm>>'
        fields[key] = field
        // @ts-expect-error Type 'keyof TForm' cannot be used to index type 'Reactive<FieldProps<TForm>>'
        fieldProps[key] = props
        // @ts-expect-error Type 'keyof TForm' cannot be used to index type 'Reactive<FieldMetaMap<TForm>>'
        fieldMeta[key] = meta
    }

    const submit = handleSubmit(async () => {
        const { post, put } = useLaravelApi()

        try {
            const response =
                method === 'POST'
                    ? await post(submitUrl, values)
                    : await put(submitUrl, values)
            if (onSubmitSuccess) {
                onSubmitSuccess(response)
            }
            return response
        } catch (error: FormError | any) {
            if (onSubmitError) {
                onSubmitError(error)
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
        ...form,
        fields,
        fieldProps,
        fieldMeta,
        submit,
    }
}
