<template>
    <NuxtLayout>
        <NuxtPage />
    </NuxtLayout>
</template>

<script setup>
useHead({
    title: 'Nuxt Laravel Playground',
    meta: [
        {
            name: 'description',
            content: 'A playground for Nuxt and Laravel integration',
        },
    ],
    link: [
        {
            rel: 'stylesheet',
            href: 'https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css',
        },
    ],
})
</script>
