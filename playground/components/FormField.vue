<template>
    <div>
        <input
            v-model="field"
            type="text"
        />
        <div
            v-if="showErrors"
            style="color: red"
        >
            {{ errors.join(', ') }}
        </div>
    </div>
</template>

<script setup lang="ts">
const props = defineProps({
    name: {
        type: String,
        required: true,
    },
    form: {
        type: Object,
        required: true,
    },
})

/**
 * Reactive field that binds to the form's fields object.
 * This allows us to use v-model on the input and have it update the form's fields
 * by mutating the form's fields object directly.
 */
const field = computed({
    get() {
        return props.form.fields[props.name]
    },
    set(value) {
        // eslint-disable-next-line vue/no-mutating-props
        props.form.fields[props.name] = value
    },
})

const errors = computed(() => {
    return props.form.errorBag.value[props.name] || []
})

const showErrors = computed(() => {
    // Show errors only after the form has been submitted at least once
    return props.form.submitCount.value > 0 && errors.value.length > 0
})
</script>
