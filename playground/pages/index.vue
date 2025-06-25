<template>
    <div>
        <LoginForm />
    </div>
</template>

<script setup lang="ts">
definePageMeta({
    middleware: 'guest',
    layout: 'guest',
})
</script>
