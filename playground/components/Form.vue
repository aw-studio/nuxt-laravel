<!-- eslint-disable vue/multi-word-component-names -->
<template>
    <form @submit.prevent="form.submit()">
        <slot :form="form" />
    </form>
</template>

<script setup lang="ts">
defineProps({
    form: {
        type: Object,
        required: true,
    },
})
</script>
