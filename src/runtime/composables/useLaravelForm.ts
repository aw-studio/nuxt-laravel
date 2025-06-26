import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { reactive, watch } from 'vue'
import type { LaravelFormOptions } from '../types'
import { useLaravelApi } from './useLaravelApi'

export function useLaravelForm<TForm extends Record<string, any>>(
    options: LaravelFormOptions<TForm>
) {
    const {
        initialValues,
        submitUrl,
        schema,
        method = 'POST',
        onSubmitSuccess,
    } = options

    const form = reactive({ ...initialValues })

    const formSchema = toTypedSchema(schema)

    const { meta, values, setFieldValue, errors, errorBag } = useForm({
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
        } catch (error) {
            console.error('Form submission error:', error)
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
