<template>
    <div class="p-16">
        <!-- <LoginForm /> -->
        <input v-model="form.fields.translation.de"
               class="border" />
        <pre>{{ form.fields }}</pre>
        <hr>
        <pre>{{ form }}</pre>
    </div>
</template>

<script setup lang="ts">
definePageMeta({
    middleware: 'guest',
    layout: 'guest',
})

const { create } = useTodos
const form = create()
</script>
