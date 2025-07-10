import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { reactive, watch } from 'vue'
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

    const form = reactive({ ...initialValues })

    const formSchema = toTypedSchema(schema)

    const { meta, values, setFieldValue, errors, errorBag, setFieldError } =
        useForm({
            validationSchema: formSchema,
            initialValues,
        })

    watch(
        () => form,
        newValue => {
            for (const key in newValue) {
                setFieldValue(key, newValue[key])
            }
        },
        { deep: true }
    )

    const submit = async () => {
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
    }

    // create a carbon copy of the initial values
    const initialValuesCopy = { ...initialValues }

    const isFieldTouched = (field: string) => {
        return Object.keys(values).some(
            key => key === field && values[key] !== initialValuesCopy[key]
        )
    }

    return {
        form,
        values,
        meta,
        errors,
        errorBag,
        submit,
        isFieldTouched,
    }
}
