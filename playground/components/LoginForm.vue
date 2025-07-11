<template>
    <div>
        <input
            v-model="fields.email"
            type="text"
            placeholder="Email"
        />
        <input
            v-model="fields.password"
            type="password"
            placeholder="Password"
        />

        <button @click="submit()">Login</button>
    </div>
</template>

<script setup lang="ts">
import { useLaravelSanctum } from '#imports'

const { login } = useLaravelSanctum()
const { fields, submit } = login
</script>
