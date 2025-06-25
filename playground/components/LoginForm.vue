<template>
    <div>
        <input
            v-model="form.email"
            type="text"
            placeholder="Email"
        />
        <input
            v-model="form.password"
            type="password"
            placeholder="Password"
        />

        <button @click="submit()">Login</button>
    </div>
</template>

<script setup lang="ts">
import { useLaravelSanctum } from '#imports'

const { login } = useLaravelSanctum()
const { form, submit } = login
</script>
