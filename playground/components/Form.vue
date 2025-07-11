<template>
    <form @submit.prevent="form.submit()">
        <slot :form="form" />
    </form>
</template>

<script setup lang="ts">
const props = defineProps({
    for: {
        type: Function,
        required: true,
    },
})

const form = props.for()
</script>
