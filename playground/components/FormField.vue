<template>
    <div class="flex flex-col">
        <label
            v-if="label"
            :for="name"
            class="font-semibold mb-1"
        >
            {{ label }}
            <span
                v-if="meta.required"
                class="text-red-500"
            >
                *
            </span>
        </label>
        <div
            class="w-full"
            :class="{
                'has-errors': showErrors,
            }"
        >
            <slot />
        </div>
        <div
            v-if="showErrors"
            class="text-red-500 text-sm"
        >
            {{ errors.join(', ') }}
        </div>
        <div
            v-if="hint"
            class="text-sm text-gray-500"
        >
            {{ hint }}
        </div>
        <!-- <pre>{{ meta }}</pre> -->
    </div>
</template>

<script setup lang="ts">
import { useField, type FormContext } from 'vee-validate'

const props = defineProps({
    name: {
        type: String,
        required: true,
    },
    form: {
        type: Object as PropType<FormContext>,
        required: true,
    },
    label: {
        type: String,
        default: undefined,
    },
    hint: {
        type: String,
        default: undefined,
    },
})

const errors = computed(() => {
    return props.form.errorBag.value[props.name] || []
})

const { meta } = useField(() => props.name, undefined, {
    form: props.form,
})

const showErrors = computed(() => {
    // Show errors only after the form has been submitted at least once
    return props.form.submitCount.value > 0 && errors.value.length > 0
})
</script>
