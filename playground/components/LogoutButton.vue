<template>
    <button @click="logout()">Logout</button>
</template>

<script setup lang="ts">
import { useLaravelSanctum } from '#imports'

const { logout } = useLaravelSanctum()
</script>
