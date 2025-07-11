<template>
    <input
        v-model="model"
        :type="type"
        class="border p-2 rounded w-full form-input"
        :placeholder="placeholder"
    />
</template>

<script setup lang="ts">
const props = defineProps({
    modelValue: {
        type: [String, Number, Boolean, Object, Array, null],
        default: undefined,
    },
    type: {
        type: String as PropType<
            'text' | 'email' | 'password' | 'number' | 'tel' | 'url'
        >,
        default: 'text',
    },
    placeholder: {
        type: String,
        default: undefined,
    },
})

const emit = defineEmits(['update:modelValue'])

const model = computed({
    get: () => props.modelValue,
    set: value => {
        // Emit the input event to update the parent component
        emit('update:modelValue', value)
    },
})
</script>

<style>
.has-errors .form-input {
    border-color: red;
}
</style>
