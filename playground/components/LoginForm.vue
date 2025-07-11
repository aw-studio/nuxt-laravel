<template>
    <Form :form>
        <FormInput
            :form
            name="email"
        >
            <input
                v-model="form.fields.email"
                type="text"
                placeholder="Email"
            />
        </FormInput>
        <FormInput
            :form
            name="password"
        >
            <input
                v-model="form.fields.password"
                type="password"
                placeholder="Password"
            />
        </FormInput>

        <button>Login</button>
    </Form>
</template>

<script setup lang="ts">
import { useLaravelSanctum } from '#imports'

const { login } = useLaravelSanctum()
const form = login()
</script>
