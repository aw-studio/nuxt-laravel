<template>
    <div>
        <!-- <input
            v-model="field"
            type="text"
        /> -->
        <slot />
        {{ field }}
        <div
            v-if="showErrors"
            style="color: red"
        >
            {{ errors.join(', ') }}
        </div>
        <pre>{{ meta }}</pre>
    </div>
</template>

<script setup lang="ts">
import { useField } from 'vee-validate'

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

const { meta } = useField(() => props.name)

function splitPath(path: string): (string | number)[] {
    // Converts "subtasks[1].title" -> ['subtasks', 1, 'title']
    return path
        .replace(/\[(\d+)\]/g, '.$1') // turn [1] into .1
        .split('.')
        .map(seg => (seg.match(/^\d+$/) ? Number(seg) : seg))
}

function getAtPath(obj: any, path: string) {
    return splitPath(path).reduce(
        (o, key) => (o == null ? undefined : o[key]),
        obj
    )
}

function setAtPath(obj: any, path: string, value: any) {
    const segments = splitPath(path)
    const last = segments.pop() as string | number
    const target = segments.reduce((o, key) => {
        // If the next level doesn’t exist, create a reactive placeholder
        if (o[key] === undefined) {
            // Decide whether it should be an array or object
            o[key] = typeof key === 'number' ? [] : {}
        }
        return o[key]
    }, obj)
    target[last] = value
}

/**
 * Reactive field that binds to the form's fields object.
 * This allows us to use v-model on the input and have it update the form's fields
 * by mutating the form's fields object directly.
 */
const field = computed({
    get() {
        // if the name includes [] (e.g. "subtasks[1].title")
        // we need to handle it as a nested property
        return getAtPath(props.form.fields, props.name)
    },
    set(val) {
        // if the name includes [] (e.g. "subtasks[1].title")
        // we need to handle it as a nested property

        // eslint-disable-next-line vue/no-mutating-props
        setAtPath(props.form.fields, props.name, val)
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
