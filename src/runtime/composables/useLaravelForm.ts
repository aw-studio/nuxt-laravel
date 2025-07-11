import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { reactive } from 'vue'
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

    const formSchema = toTypedSchema(schema)

    const form = useForm({
        validationSchema: formSchema,
        initialValues,
    })

    const { values, setFieldError, defineField, handleSubmit } = form

    /**
     * Define reactive fields and their properties
     * This will create a field for each key in the initialValues object
     * and make them reactive so that they can be used in the template.
     */
    const fields: Record<string, any> = reactive({})
    const fieldProps: Record<string, any> = reactive({})

    for (const key in initialValues) {
        // Define each field with its initial value
        const [field, props] = defineField(key)
        fields[key] = field
        fieldProps[key] = props
    }

    /**
     * Submit function that handles the form submission
     * It uses the Laravel API client to send a POST or PUT request
     * based on the method specified in the options.
     */
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
        submit,
    }
}
