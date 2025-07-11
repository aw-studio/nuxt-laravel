<template>
    <div class="p-16">
        <LoginForm />
    </div>
</template>

<script setup lang="ts">
definePageMeta({
    middleware: 'guest',
    layout: 'guest',
})
</script>
